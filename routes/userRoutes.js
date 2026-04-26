// routes/userRoutes.js
const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const { signup, login }                       = require("../controllers/authcontroller");
const { signupSchema, loginSchema }           = require("../validations/authValidation");
const validate                                = require("../middleware/validate");
const auth = require("../middleware/userAuth")
const userController = require("../controllers/userControllers")



const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
router.post("/signup", upload.single("avatar"), validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.get("/profile",auth,userController.getUserProFile)
router.put("/update", auth, upload.single("avatar"), userController.updateUser);
router.delete("/delete",auth,userController.deleteUser)
router.put("/changePassword", auth,userController.changePassword)
router.put("/hideCollection",auth, userController.updateSavedAlbumsVisibility)
router.get("/getUsers",auth,userController.getAllUsers)
router.get("/getUser/friends/:id",auth,userController.getUserBandmates)
module.exports = router;