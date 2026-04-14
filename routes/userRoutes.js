// routes/userRoutes.js
const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const { signup, login }                       = require("../controllers/authcontroller");
const { signupSchema, loginSchema }           = require("../validations/authValidation");
const validate                                = require("../middleware/validate");

const upload = multer({ dest: "uploads/avatars/" });

// ✅ /api/auth/signup
router.post("/signup", upload.single("avatar"), validate(signupSchema), signup);

// ✅ /api/auth/login
router.post("/login", validate(loginSchema), login);

module.exports = router;