// controllers/quizController.js (ตัวอย่าง)
const QuizSubmission = require("../models/QuizSubmission");
const Course = require("../models/Course");
const Order = require("../models/Order");
const Certificate = require("../models/Certificate");

async function issueCertificateIfEligible(userId, courseId) {
  // 1) เช็คว่ามี Order paid แล้ว
  const paidOrder = await Order.findOne({
    userId,
    courseId,
    paymentStatus: "paid",
  }).sort({ purchaseDate: 1 });

  if (!paidOrder) return null;

  // 2) ดึงสถานะ quiz ทั้ง pre และ post
  const pre = await QuizSubmission.findOne({
    userId,
    courseId,
    type: "pre",
  });

  const post = await QuizSubmission.findOne({
    userId,
    courseId,
    type: "post",
  });

  if (!pre || !post) return null;
  if (!post.passed) return null; // ยังไม่ผ่าน post-test

  // 3) เกณฑ์ผ่าน
  const course = await Course.findById(courseId);
  const passingPercent = course?.passingScorePercent || 80;

  const postPercent = post.total > 0 ? (post.bestScore / post.total) * 100 : 0;

  if (postPercent < passingPercent) return null;

  // 4) ถ้าผ่านทุกเงื่อนไข → upsert Certificate
  const code =
    "CERT-" +
    (courseId.toString().slice(-4) || "XXXX") +
    "-" +
    Date.now().toString(36).toUpperCase();

  const cert = await Certificate.findOneAndUpdate(
    { userId, courseId },
    {
      $setOnInsert: {
        certificateCode: code,
      },
      $set: {
        orderId: paidOrder._id,
        preTestScore: pre.lastScore,
        preTestTotal: pre.total,
        postTestScore: post.bestScore,
        postTestTotal: post.total,
        passingScorePercent: passingPercent,
        issuedAt: new Date(),
      },
    },
    { new: true, upsert: true }
  );

  return cert;
}

// ===== ใน endpoint ส่งคำตอบ post-test =====
exports.submitPostTest = async (req, res) => {
  const userId = req.user.id;
  const { id: courseId } = req.params;
  const { answers } = req.body;

  // ... logic 1: โหลด course, ดึง postTest, คำนวณ score ...
  // สมมติได้ score, total และตั้งค่า passed = score/total >= passingPercent

  // บันทึก/อัปเดต QuizSubmission type "post"
  const submission = await QuizSubmission.findOneAndUpdate(
    { userId, courseId, type: "post" },
    {
      $set: {
        total,
      },
      $inc: { attemptCount: 1 },
      $setOnInsert: { bestScore: score, lastScore: score },
    },
    { new: true, upsert: true }
  );

  // อัปเดต bestScore, passed
  submission.lastScore = score;
  if (score > submission.bestScore) {
    submission.bestScore = score;
  }
  submission.passed = score / total >= passingPercent;
  submission.attempts.push({ score, total, answers });
  await submission.save();

  // เรียกเช็ค + ออก certificate ถ้าเข้าเงื่อนไข
  const cert = await issueCertificateIfEligible(userId, courseId);

  res.json({
    score,
    total,
    passed: submission.passed,
    certificateIssued: !!cert,
    certificateId: cert?._id || null,
  });
};
