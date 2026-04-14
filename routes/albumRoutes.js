const express  = require("express");
const router   = express.Router();
const auth = require("../middleware/userAuth")
const albumControllers = require("../controllers/albumController")

router.get("/get/albums",auth,albumControllers.searchAlbums)

module.exports = router