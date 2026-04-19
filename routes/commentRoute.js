const express  = require('express');
const router   = express.Router();
const auth     = require('../middleware/userAuth');
const { postComment } = require('../controllers/commentController');
const { validateBody, postCommentSchema } = require('../validations/commentvalidation'); // your validation file path


router.post('/postComment/:album_id', auth,validateBody(postCommentSchema), postComment);

module.exports = router;