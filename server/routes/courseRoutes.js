const express = require("express");
const router = express.Router();

const Course = require("../models/Course");
const CourseQuiz = require("../models/CourseQuiz");
const verifyToken = require("../middleware/verifyToken");
const isAdmin = require("../middleware/isAdmin");
const QuizSubmission = require("../models/QuizSubmission");
const Order = require("../models/Order");
const Certificate = require("../models/Certificate");

// =======================
// PUBLIC ROUTES
// =======================

// GET /api/courses  => ดึงคอร์สทั้งหมด
// (ใน Course document มี curriculum ฝังอยู่แล้ว ตาม schema)
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/:id
// => ดึงคอร์สตัวเดียว + preTest / postTest จาก CourseQuiz มาติดให้ด้วย
router.get("/:id", async (req, res) => {
  try {
    // ใช้ lean() เพื่อจะได้แก้ไข object เพิ่ม field ได้ง่าย
    const course = await Course.findById(req.params.id).lean();
    if (!course) return res.status(404).json({ error: "Course not found" });

    // ดึงข้อสอบจาก CourseQuiz โดยผูกจาก course._id
    const quizDoc = await CourseQuiz.findOne({ courseId: course._id }).lean();

    // เติม preTest / postTest เข้าไปใน object ที่จะส่งออก
    course.preTest = quizDoc?.preTest || [];
    course.postTest = quizDoc?.postTest || [];

    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =======================
// ADMIN ROUTES
// =======================

// POST /api/courses
// => สร้างคอร์สใหม่ + สร้าง/อัปเดตชุดข้อสอบ (CourseQuiz)
router.post("/", verifyToken, isAdmin, async (req, res) => {
  try {
    // แยก field ที่เป็นข้อสอบออกมา ไม่ให้ไปลงใน Course โดยตรง
    const { preTest, postTest, ...courseData } = req.body;

    // 1) สร้าง Course (จะมี curriculum อยู่ในตัว courseData แล้ว)
    const newCourse = new Course(courseData);
    const savedCourse = await newCourse.save();

    // 2) ถ้ามีส่ง preTest / postTest มาด้วย ให้ upsert เข้า CourseQuiz
    if (
      (Array.isArray(preTest) && preTest.length > 0) ||
      (Array.isArray(postTest) && postTest.length > 0)
    ) {
      await CourseQuiz.findOneAndUpdate(
        { courseId: savedCourse._id },
        {
          courseId: savedCourse._id,
          preTest: Array.isArray(preTest) ? preTest : [],
          postTest: Array.isArray(postTest) ? postTest : [],
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.status(201).json(savedCourse);
  } catch (err) {
    console.error("Create course error:", err);
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/courses/:id
// => แก้ไขคอร์ส + แก้ไขชุดข้อสอบ
router.put("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { preTest, postTest, ...courseData } = req.body;

    // 1) อัปเดตข้อมูลคอร์ส (รวม curriculum ที่อยู่ใน courseData)
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      courseData,
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ error: "Course not found" });
    }

    // 2) อัปเดตชุดข้อสอบ (ถ้ามี field preTest / postTest ส่งมา)
    const quizUpdate = { courseId: req.params.id };
    let shouldUpdateQuiz = false;

    if (Array.isArray(preTest)) {
      quizUpdate.preTest = preTest;
      shouldUpdateQuiz = true;
    }
    if (Array.isArray(postTest)) {
      quizUpdate.postTest = postTest;
      shouldUpdateQuiz = true;
    }

    if (shouldUpdateQuiz) {
      await CourseQuiz.findOneAndUpdate(
        { courseId: req.params.id },
        quizUpdate,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.json(updatedCourse);
  } catch (err) {
    console.error("Update course error:", err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/courses/:id
// => ลบคอร์ส + ลบชุดข้อสอบที่ผูกกับคอร์สนั้น
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const deletedCourse = await Course.findByIdAndDelete(req.params.id);
    if (!deletedCourse) {
      return res.status(404).json({ error: "Course not found" });
    }

    // ลบชุดข้อสอบที่ผูกกับคอร์สนี้ด้วย
    await CourseQuiz.findOneAndDelete({ courseId: req.params.id });

    res.status(200).json({ message: "คอร์สถูกลบแล้ว" });
  } catch (err) {
    console.error("Delete course error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =======================
// QUIZ STATUS (ของผู้ใช้)
// GET /api/courses/:id/quiz/status
// =======================
router.get("/:id/quiz/status", verifyToken, async (req, res) => {
  try {
    const [pre, post] = await Promise.all([
      QuizSubmission.findOne({
        userId: req.user.id,
        courseId: req.params.id,
        type: "pre",
      }),
      QuizSubmission.findOne({
        userId: req.user.id,
        courseId: req.params.id,
        type: "post",
      }),
    ]);

    res.json({
      pre: pre
        ? {
            attemptCount: pre.attemptCount,
            bestScore: pre.bestScore,
            lastScore: pre.lastScore,
            total: pre.total,
            passed: pre.passed,
          }
        : null,
      post: post
        ? {
            attemptCount: post.attemptCount,
            bestScore: post.bestScore,
            lastScore: post.lastScore,
            total: post.total,
            passed: post.passed,
          }
        : null,
    });
  } catch (err) {
    console.error("Get quiz status error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =======================
// SUBMIT QUIZ (pre / post)
// POST /api/courses/:id/quiz/:type
// body: { answers: [Number, ...] }
// =======================
router.post("/:id/quiz/:type", verifyToken, async (req, res) => {
  try {
    const { type } = req.params; // 'pre' | 'post'
    const { answers = [] } = req.body;

    if (!["pre", "post"].includes(type)) {
      return res.status(400).json({ message: "invalid type" });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // ดึงคำถาม + config quiz จาก CourseQuiz
    const quizConfig = await CourseQuiz.findOne({ courseId: course._id });
    if (!quizConfig) {
      return res
        .status(400)
        .json({ message: "no quiz config for this course" });
    }

    const questions =
      type === "pre" ? quizConfig.preTest || [] : quizConfig.postTest || [];
    const total = questions.length;
    if (!total) return res.status(400).json({ message: "no questions" });

    // ถ้าคอร์สนี้ requirePreTest = true → ห้ามทำ post ถ้ายังไม่เคยทำ pre
    if (type === "post" && quizConfig.requirePreTest) {
      const pre = await QuizSubmission.findOne({
        userId: req.user.id,
        courseId: course._id,
        type: "pre",
      });

      if (!pre) {
        return res.status(400).json({
          message: "ต้องทำ Pre-test ก่อนถึงจะทำ Post-test ได้",
        });
      }
    }

    // ใช้ passingScorePercent จาก CourseQuiz (default = 80%)
    const passingPercent =
      typeof quizConfig.passingScorePercent === "number"
        ? quizConfig.passingScorePercent
        : 80;

    const passThreshold = Math.ceil((passingPercent / 100) * total);

    // หา record เดิมของผู้ใช้
    let record = await QuizSubmission.findOne({
      userId: req.user.id,
      courseId: course._id,
      type,
    });

    // ====== กติกาเดิม ======
    if (type === "pre") {
      // preTest ทำได้ครั้งเดียว
      if (record && record.attemptCount >= 1) {
        return res.status(400).json({ message: "preTest ทำได้ครั้งเดียว" });
      }
    } else {
      // postTest ทำได้หลายครั้งจนกว่าจะ "ผ่าน"
      if (record && record.passed) {
        return res
          .status(400)
          .json({ message: "postTest ผ่านแล้ว ไม่สามารถทำซ้ำ" });
      }
    }

    // คำนวณคะแนน
    let score = 0;
    questions.forEach((q, i) => {
      if (Number(answers[i]) === Number(q.correctIndex)) score++;
    });

    const passed = score >= passThreshold;

    // บันทึก (upsert) QuizSubmission
    if (!record) {
      record = await QuizSubmission.create({
        userId: req.user.id,
        courseId: course._id,
        type,
        attemptCount: 1,
        bestScore: score,
        lastScore: score,
        total,
        passed,
        attempts: [{ score, total, answers }],
      });
    } else {
      record.attemptCount += 1;
      record.lastScore = score;
      record.total = total;
      if (score > record.bestScore) record.bestScore = score;

      if (type === "post" && passed) record.passed = true;

      record.attempts.push({ score, total, answers });
      await record.save();
    }

    let cert = null;
    if (type === "post") {
      cert = await issueCertificateIfEligible(req.user.id, course._id);
    }

    return res.json({
      type,
      score,
      total,
      passed,
      attemptCount: record.attemptCount,
      bestScore: record.bestScore,
      passThreshold,
      certificateIssued: !!cert,
      certificateId: cert?._id || null,
    });
  } catch (err) {
    console.error("Submit quiz error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ฟังก์ชันออก Certificate ถ้าเข้าเงื่อนไข
async function issueCertificateIfEligible(userId, courseId) {
  const pre = await QuizSubmission.findOne({ userId, courseId, type: "pre" });
  const post = await QuizSubmission.findOne({ userId, courseId, type: "post" });

  if (!pre || !post) return null;
  if (!post.passed) return null;

  const quizConfig = await CourseQuiz.findById(courseId);
  const passingPercent = quizConfig?.passingScorePercent || 80;

  const postPercent = post.total > 0 ? (post.bestScore / post.total) * 100 : 0;
  if (postPercent < passingPercent) return null;

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
        preTestScore: pre.lastScore || 0,
        preTestTotal: pre.total || 0,
        postTestScore: post.bestScore || 0,
        postTestTotal: post.total || 0,
        passingScorePercent: passingPercent,
        issuedAt: new Date(),
      },
    },
    { new: true, upsert: true }
  );

  return cert;
}

module.exports = router;
