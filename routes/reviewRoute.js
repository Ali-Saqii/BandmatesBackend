const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/userAuth');
const { postReview }= require('../controllers/reviewController');


router.post('/postReview/:album_id', auth, postReview);

module.exports = router;