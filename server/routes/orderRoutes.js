const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Course = require('../models/Course');
const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');
const Notification = require("../models/Notification");
const { sendMail } = require("../utils/mailer");

// GET /api/orders => ดูรายการคำสั่งซื้อทั้งหมดของผู้ใช้ที่ล็อกอิน
router.get('/', verifyToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).populate('courseId');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders => สร้างคำสั่งซื้อใหม่ (ขั้นตอนแรกก่อนชำระเงิน)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    const existingOrder = await Order.findOne({ userId, courseId, paymentStatus: 'paid' });
    if (existingOrder) {
      return res.status(400).json({ message: 'คุณได้ซื้อคอร์สนี้ไปแล้ว' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'ไม่พบคอร์สที่ระบุ' });
    }

    const newOrder = new Order({
      courseId: courseId,
      userId: userId,
      totalPrice: course.price,
      customerName: `${req.user.name} ${req.user.lastname}`,
      customerEmail: req.user.email,
      paymentStatus: 'pending',
      // สลิปเริ่มต้น
      slipUrl: "",
      slipUploadedAt: null,
      slipNote: "",
      reviewedBy: null,
      reviewedAt: null,
      paidAt: null,
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================================================
 * USER: แนบสลิป
 * PATCH /api/orders/:id/upload-slip
 * body: { slipUrl, slipNote? }
 * ========================================================= */
router.patch('/:id/upload-slip', verifyToken, async (req, res) => {
  try {
    const { slipUrl, slipNote } = req.body;

    if (!slipUrl || typeof slipUrl !== "string") {
      return res.status(400).json({ message: "กรุณาแนบสลิปก่อน" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "ไม่พบคำสั่งซื้อ" });

    // ต้องเป็นเจ้าของออเดอร์เท่านั้น
    if (String(order.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์แก้ไขคำสั่งซื้อนี้" });
    }

    // กันกรณีชำระแล้ว
    if (order.paymentStatus === "paid") {
      return res.status(400).json({ message: "คำสั่งซื้อนี้ชำระแล้ว ไม่สามารถแนบสลิปเพิ่มได้" });
    }

    order.slipUrl = slipUrl;
    order.slipUploadedAt = new Date();
    order.slipNote = typeof slipNote === "string" ? slipNote : order.slipNote;

    // แนบสลิปแล้วสถานะยังเป็น pending (รอแอดมินอนุมัติ)
    order.paymentStatus = "pending";

    await order.save();
    const populated = await Order.findById(order._id).populate('courseId');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Admin Routes ---

// GET /api/orders/admin/all => แอดมินดูคำสั่งซื้อทั้งหมด
router.get('/admin/all', verifyToken, isAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate('courseId').populate('userId', 'name email');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/orders/:id/update-status => แอดมินอัปเดตสถานะการชำระเงิน
router.patch("/:id/update-status", verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    // ดึง order เดิมมาก่อนเพื่อดูว่าเปลี่ยนสถานะจริงไหม
    const orderBefore = await Order.findById(req.params.id)
      .populate("courseId")
      .populate("userId", "name email");

    if (!orderBefore) return res.status(404).send("ไม่พบคำสั่งซื้อ");

    const prevStatus = orderBefore.paymentStatus;

    // อัปเดตสถานะ
    orderBefore.paymentStatus = status;
    await orderBefore.save();

    // ✅ ถ้าเปลี่ยนจากไม่ใช่ paid -> เป็น paid => แจ้งเตือน + ส่งเมล
    if (prevStatus !== "paid" && status === "paid") {
      const courseTitle = orderBefore.courseId?.title || "คอร์สของคุณ";
      const email = orderBefore.userId?.email || orderBefore.customerEmail;

      // 1) สร้างแจ้งเตือนในระบบ
      await Notification.create({
        userId: orderBefore.userId?._id,
        type: "order",
        title: "อนุมัติการชำระเงินสำเร็จ ✅",
        message: `คำสั่งซื้อ "${courseTitle}" ได้รับการอนุมัติแล้ว คุณสามารถเข้าเรียนได้ทันที`,
        link: "/my-orders",
        isRead: false,
      });

      // 2) ส่งเมล
      const appUrl = process.env.APP_URL || "http://localhost:5173";
      await sendMail({
        to: email,
        subject: "CourseSi: อนุมัติการชำระเงินสำเร็จ",
        text: `อนุมัติการชำระเงินสำเร็จสำหรับ "${courseTitle}" เข้าเรียนได้ที่ ${appUrl}/my-orders`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6">
            <h2>อนุมัติการชำระเงินสำเร็จ ✅</h2>
            <p>คำสั่งซื้อคอร์ส <b>${courseTitle}</b> ได้รับการอนุมัติแล้ว</p>
            <p>คุณสามารถเข้าเรียนได้ทันทีที่หน้า <a href="${appUrl}/my-orders">${appUrl}/my-orders</a></p>
            <hr />
            <p style="color:#666;font-size:12px">CourseSi</p>
          </div>
        `,
      });
    }

    // ส่งกลับ (populate ให้ UI สวย)
    const updatedOrder = await Order.findById(orderBefore._id)
      .populate("courseId")
      .populate("userId", "name email");

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/orders/:id => แอดมินลบคำสั่งซื้อ
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'ลบคำสั่งซื้อสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
