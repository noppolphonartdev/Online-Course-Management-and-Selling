const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const authController = require('../controllers/authController');

// --- Multer Setup for Avatar Upload ---
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `avatar-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });
// -------------------------------------

// --- Authentication Routes ---

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/verify/:token
router.get('/verify/:token', authController.verifyEmail);

// POST /api/auth/resend-verification
router.post('/resend-verification', authController.resendVerification);

// -------------------------------------
// --- User Profile Routes (Protected) ---

// PUT /api/auth/profile (Update name, lastname)
router.put('/profile', verifyToken, authController.updateProfile);

// POST /api/auth/avatar (Upload profile picture)
router.post('/avatar', verifyToken, upload.single('avatar'), authController.uploadAvatar);

// PUT /api/auth/change-password
router.put('/change-password', verifyToken, authController.changePassword);


module.exports = router;