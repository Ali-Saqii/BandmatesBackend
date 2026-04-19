const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/userAuth');
const { postReview }= require('../controllers/reviewController');
const { validateBody, postReviewSchema } = require('../validations/postReviewValidation'); // your validation file path


router.post('/postReview/:album_id', auth, validateBody(postReviewSchema),postReview);

module.exports = router;