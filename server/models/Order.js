const mongoose = require("mongoose");

// Schema สำหรับเก็บข้อมูล "คำสั่งซื้อ" (Order)
const orderSchema = new mongoose.Schema({
  // --- ข้อมูลหลักของคำสั่งซื้อ ---
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // --- ข้อมูลการชำระเงิน ---
  totalPrice: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed", "refunded"], // สถานะการชำระเงิน
    default: "pending",
  },
  paymentIntentId: {
    // รหัสอ้างอิงจาก Payment Gateway เช่น Omise, Stripe
    type: String,
  },

  // --- ข้อมูลลูกค้า (เก็บไว้เพื่อความสะดวก) ---
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String },

  // --- วัน-เวลา ---
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
