const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/userAuth');
const { postComment } = require('../controllers/commentController');


router.post('/postComment/:album_id', auth , postComment);

module.exports = router;