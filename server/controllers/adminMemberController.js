const User = require('../models/User');

const ALLOWED_FIELDS = ['name', 'lastname', 'email', 'role', 'verified'];

exports.getMembers = async (req, res) => {
  try {
    const members = await User.find()
      .select('-password')
      .sort({ _id: -1 });
    res.json(members);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'เกิดข้อผิดพลาดในการโหลดสมาชิก', error: err.message });
  }
};

exports.updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    ALLOWED_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.email) {
      const existing = await User.findOne({ email: updates.email });
      if (existing && existing._id.toString() !== id) {
        return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
      }
    }

    const updated = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updated) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลสมาชิก' });
    }

    res.json(updated);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'เกิดข้อผิดพลาดในการอัปเดตสมาชิก', error: err.message });
  }
};
