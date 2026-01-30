// routes/uploadRoutes.js
// อัปโหลดรูปภาพและวิดีโอ พร้อมตรวจชนิดไฟล์/จำกัดขนาด/จัดการ error

const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const router = express.Router();

/* ----------------------------
 * 1) เตรียมโฟลเดอร์อัปโหลด
 * ---------------------------- */
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/* ---------------------------------------
 * 2) ฟังก์ชันช่วยตั้งชื่อไฟล์แบบสุ่ม+เวลา
 * --------------------------------------- */
function makeSafeFilename(originalname) {
  const ext = path.extname(originalname).toLowerCase();
  const base = crypto.randomBytes(6).toString("hex"); // สุ่ม 12 ตัว
  return `${Date.now()}-${base}${ext}`;
}

/* ---------------------------------------
 * 3) Storage (ใช้โฟลเดอร์ uploads/)
 * --------------------------------------- */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    cb(null, makeSafeFilename(file.originalname));
  },
});

/* ------------------------------------------------
 * 4) ตัวกรองชนิดไฟล์ (ภาพ / วิดีโอ) + ตรวจ mimetype
 * ------------------------------------------------ */
const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;
const VIDEO_EXT = /\.(mp4|webm|ogg|mov|m4v)$/i;

const imageFilter = (req, file, cb) => {
  const okByExt = IMAGE_EXT.test(path.extname(file.originalname));
  const okByMime = /^image\//i.test(file.mimetype);
  if (okByExt && okByMime) return cb(null, true);
  cb(new Error("รองรับเฉพาะไฟล์ภาพ: jpg, jpeg, png, gif, webp"), false);
};

const videoFilter = (req, file, cb) => {
  const okByExt = VIDEO_EXT.test(path.extname(file.originalname));
  const okByMime = /^video\//i.test(file.mimetype);
  if (okByExt && okByMime) return cb(null, true);
  cb(new Error("รองรับเฉพาะไฟล์วิดีโอ: mp4, webm, ogg, mov, m4v"), false);
};

/* ------------------------------------------------
 * 5) Multer instances แยกตามชนิด + จำกัดขนาด
 * ------------------------------------------------ */
const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const uploadVideo = multer({
  storage,
  fileFilter: videoFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

/* ---------------------------------------
 * 6) Routes
 * --------------------------------------- */

// POST /api/upload        (field = image)
router.post("/", uploadImage.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "กรุณาเลือกไฟล์ภาพ" });
  }
  // ส่ง URL เข้าถึงไฟล์ (ให้ server serve static /uploads ไว้แล้ว)
  res.json({ imageUrl: `/uploads/${req.file.filename}` });
});

// POST /api/upload/video  (field = video)
router.post("/video", uploadVideo.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "กรุณาเลือกไฟล์วิดีโอ" });
  }
  res.json({ videoUrl: `/uploads/${req.file.filename}` });
});

/* ---------------------------------------
 * 7) ตัวดักจับ Error ของ Multer/อัปโหลด
 *    (เฉพาะ router นี้)
 * --------------------------------------- */
router.use((err, req, res, next) => {
  // Multer ขว้าง error เมื่อชนิดไฟล์ไม่ตรง/ไฟล์ใหญ่เกิน ฯลฯ
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      // แยกระหว่างภาพ/วิดีโอเพื่อบอกลิมิตที่ต่างกัน
      const isVideo = req.originalUrl.includes("/video");
      const limitMB = isVideo ? 500 : 10;
      return res
        .status(400)
        .json({ message: `ไฟล์ใหญ่เกินกำหนด (สูงสุด ${limitMB}MB)` });
    }
    return res.status(400).json({ message: `อัปโหลดล้มเหลว: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ message: err.message || "อัปโหลดล้มเหลว" });
  }
  next();
});

module.exports = router;
