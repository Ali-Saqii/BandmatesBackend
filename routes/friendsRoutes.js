const express = require("express")
const router = express.router()
const auth = require("../middleware/userAuth")
const fControllers = require("../controllers/friendsController")


router.post("/friends/request", auth, sendFriendRequest);
router.patch("/friends/accept/:requestId", auth, acceptFriendRequest);
router.patch("/friends/reject/:requestId", auth, rejectFriendRequest);

module.exports = router;
