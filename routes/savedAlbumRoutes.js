const express = require("express");
const router = express.Router();
const auth = require("../middleware/userAuth")
const sAcontrollers = require("../controllers/savedAlbumsController")


router.post("/saveAlbum/add",auth,sAcontrollers.savedAlbum)
router.delete("/savedAlbum/delete/:album_id/:collection_id",auth,sAcontrollers.removeAlbum)
router.get("/user/savedAlbums/:id",auth, sAcontrollers.getUserSavedAlbums);
module.exports = router