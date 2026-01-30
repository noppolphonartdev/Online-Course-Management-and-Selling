const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/verifyToken");
const Certificate = require("../models/Certificate");

// GET /api/certificates/:courseId/me
// ใช้ฝั่งผู้เรียนถามว่าคอร์สนี้มี certificate หรือยัง
router.get("/:courseId/me", verifyToken, async (req, res) => {
  try {
    const cert = await Certificate.findOne({
      userId: req.user.id,
      courseId: req.params.courseId,
    })
      .populate("courseId", "title instructor")
      .populate("userId", "name lastname email");

    if (!cert) {
      return res.status(404).json({ hasCertificate: false });
    }

    res.json({
      hasCertificate: true,
      certificate: cert,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
