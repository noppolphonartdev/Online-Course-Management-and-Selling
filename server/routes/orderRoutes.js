const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Course = require('../models/Course');
const verifyToken = require('../middleware/verifyToken');
const isAdmin = require('../middleware/isAdmin');

// GET /api/orders => ดูรายการคำสั่งซื้อทั้งหมดของผู้ใช้ที่ล็อกอิน
router.get('/', verifyToken, async (req, res) => {
  try {
    //ค้นหาด้วย userId จาก token
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

    // ตรวจสอบว่าเคยซื้อคอร์สนี้สำเร็จแล้วหรือยัง
    const existingOrder = await Order.findOne({ userId, courseId, paymentStatus: 'paid' });
    if (existingOrder) {
      return res.status(400).json({ message: 'คุณได้ซื้อคอร์สนี้ไปแล้ว' });
    }

    // ดึงข้อมูลคอร์สเพื่อเอาราคาที่ถูกต้อง
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'ไม่พบคอร์สที่ระบุ' });
    }

    //สร้าง Order ตาม Schema
    const newOrder = new Order({
      courseId: courseId,
      userId: userId,
      totalPrice: course.price,
      customerName: `${req.user.name} ${req.user.lastname}`,
      customerEmail: req.user.email,
      paymentStatus: 'pending', // สถานะเริ่มต้นคือรอดำเนินการ
    });

    await newOrder.save();
    res.status(201).json(newOrder); // ส่งข้อมูล order ที่สร้างใหม่กลับไป

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
router.patch('/:id/update-status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body; // รับ status ใหม่จาก body (เช่น 'paid', 'failed')
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: status },
      { new: true }
    );
    if (!updatedOrder) return res.status(404).send('ไม่พบคำสั่งซื้อ');
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