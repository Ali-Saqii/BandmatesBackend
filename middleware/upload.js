const multer  = require("multer");
const path    = require("path");
const crypto  = require("crypto");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/avatars/"); // ← folder to save images
    },
    filename: (req, file, cb) => {
        const ext      = path.extname(file.originalname); // ← gets .jpg .png etc
        const filename = crypto.randomBytes(16).toString("hex") + ext; // ← unique name WITH extension
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPEG, PNG, and WebP images are allowed"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } 
});
module.exports = upload;