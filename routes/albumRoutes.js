const express  = require("express");
const router   = express.Router();
const auth = require("../middleware/userAuth")
const albumControllers = require("../controllers/albumController")
router.get("/get/albums",auth,albumControllers.getTrendingAlbums)

module.exports = router

// Qra*RPpNZV<8Cb*