const express = require("express")
const router = express.router()
const auth = require("../middleware/userAuth")
const fControllers = require("../controllers/friendsController")


router.post("/friends/request", auth, fControllers.sendFriendRequest);
router.patch("/friends/accept/:requestId", auth, fControllers.acceptFriendRequest);
router.patch("/friends/reject/:requestId", auth, fControllers.rejectFriendRequest);

module.exports = router;
