const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const verifyToken = require("../middleware/verifyToken");

// GET /api/notifications -> ดึงแจ้งเตือนของผู้ใช้ (ล่าสุดก่อน)
router.get("/", verifyToken, async (req, res) => {
  try {
    const list = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/notifications/unread-count -> จำนวนแจ้งเตือนที่ยังไม่อ่าน (โชว์ที่ Navbar)
router.get("/unread-count", verifyToken, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user.id,
      isRead: false,
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/notifications/read-all -> อ่านแล้วทั้งหมด
router.patch("/read-all", verifyToken, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/notifications/:id/read -> ทำเป็นอ่านแล้ว 1 อัน
router.patch("/:id/read", verifyToken, async (req, res) => {
  try {
    const noti = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!noti) return res.status(404).json({ message: "ไม่พบแจ้งเตือน" });
    res.json(noti);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;