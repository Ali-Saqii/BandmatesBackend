const express = require("express")
const router = express.Router()
const auth = require("../middleware/userAuth")
cControllers = require("../controllers/collectionsController")


router.post("/create/collection",auth, cControllers.createCollection)

module.exports = router