const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

/* -----------------------------
 * โฟลเดอร์อัปโหลด
 * ----------------------------- */
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/* -----------------------------
 * Middleware พื้นฐาน
 * ----------------------------- */
app.use(cors());
app.use(express.json({ limit: "10mb" })); // สำหรับ payload JSON ทั่วไป (multer ดูแล multipart)

/* -----------------------------
 * เสิร์ฟไฟล์สาธารณะ (รูป/วิดีโอ)
 * ใช้ absolute path เพื่อความชัวร์
 * ----------------------------- */
app.use("/uploads", express.static(UPLOAD_DIR)); // เช่น http://localhost:5000/uploads/xxx.mp4

/* -----------------------------
 * Routes
 * ----------------------------- */
const courseRoutes = require("./routes/courseRoutes");
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const quizRoutes = require("./routes/quizRoutes");
const certificateRoutes = require("./routes/certificateRoutes");


app.use("/api/courses", courseRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/certificates", certificateRoutes);

// health check ง่าย ๆ
app.get("/health", (req, res) => res.json({ ok: true }));

/* -----------------------------
 * Global Error Handler (ออปชัน)
 * ถ้า route ไหนโยน error ออกมา จะลงที่นี่
 * ----------------------------- */
app.use((err, req, res, next) => {
  console.error(err);
  // ถ้ามาจาก Multer จะมี code พิเศษ
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "ไฟล์ใหญ่เกินกำหนด" });
  }
  res
    .status(err.status || 500)
    .json({ message: err.message || "Server error" });
});

/* -----------------------------
 * เชื่อม MongoDB แล้วค่อย start server
 * ----------------------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
