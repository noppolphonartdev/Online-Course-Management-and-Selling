const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// --- Utility Functions (ฟังก์ชันช่วย) ---

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      verified: user.verified,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const sendVerificationEmail = async (user, token) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  const url = `${process.env.BASE_URL}/verify/${token}`;
  await transporter.sendMail({
    from: `"Course System" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'กรุณายืนยันอีเมลของคุณ',
    html: `<p>คลิกเพื่อยืนยัน: <a href="${url}">${url}</a></p>`,
  });
};

// --- Controller Functions (Logic หลัก) ---
exports.register = async (req, res) => {
  const { name, lastname, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "อีเมลนี้ถูกใช้ไปแล้ว" });
    }
    const user = new User({ name, lastname, email, password });
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    await sendVerificationEmail(user, token);
    res.json({ message: "สมัครเสร็จแล้ว โปรดยืนยันอีเมลก่อนเข้าสู่ระบบ" });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    }
    res.json({
      _id: user._id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      verified: user.verified,
      token: generateToken(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).send("ไม่พบผู้ใช้");
    if (user.verified) return res.send("คุณได้ยืนยันแล้ว");
    user.verified = true;
    await user.save();
    res.send("ยืนยันอีเมลสำเร็จแล้ว! คุณสามารถเข้าสู่ระบบได้");
  } catch (err) {
    res.status(400).send("ลิงก์ยืนยันไม่ถูกต้องหรือหมดอายุ");
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, lastname } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
    user.name = name || user.name;
    user.lastname = lastname || user.lastname;
    await user.save();
    res.json({
      _id: user._id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      verified: user.verified,
      token: req.headers.authorization.split(' ')[1],
    });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'กรุณาเลือกไฟล์ภาพ' });
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    user.avatar = `/uploads/${req.file.filename}`;
    await user.save();
    res.json({
      _id: user._id,
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      verified: user.verified,
      token: req.headers.authorization.split(' ')[1],
    });
  } catch (err) {
    res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
  }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) return res.status(400).json({ message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
        if (newPassword.length < 6) return res.status(400).json({ message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร" });
        user.password = newPassword;
        await user.save();
        res.json({ message: "เปลี่ยนรหัสผ่านสำเร็จ" });
    } catch (err) {
        res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err.message });
    }
};

exports.resendVerification = async (req, res) => {
};