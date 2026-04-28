const express  = require("express");
const router   = express.Router();
const auth = require("../middleware/userAuth")
const albumControllers = require("../controllers/chart")

router.get("/get/chart",auth,albumControllers.getAlbumChart)

module.exports = router
