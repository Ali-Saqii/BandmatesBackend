const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/userAddSubscriptionPlan");
const authMiddleware = require("../middleware/userAuth"); // your existing auth

router.post("/select/plan",  authMiddleware, subscriptionController.selectPlan);
router.post("/cancel/plan",  authMiddleware, subscriptionController.cancelPlan);
module.exports = router;
