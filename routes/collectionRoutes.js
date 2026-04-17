const express = require("express")
const router = express.Router()
const auth = require("../middleware/userAuth")
cControllers = require("../controllers/collectionsController")


router.post("/create/collection",auth, cControllers.createCollection)
router.put("/update/collection/:id",auth,cControllers.updateCollection)
router.get("/get/collection",auth,cControllers.getUserCollection)
router.delete("/delete/collection/:id",auth,cControllers.deleteCollection)
module.exports = router