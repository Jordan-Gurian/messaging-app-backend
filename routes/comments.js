var express = require('express');
const commentController = require('../controllers/commentController');
const router = express.Router();
const verifyToken = require('../authentication/tokenUtils');

// GET specific comment from server
router.get('/:commentId', commentController.getComment);

// POST new comment to server
router.post('/', verifyToken, commentController.postComment);

// PUT route to update comment
router.put('/:commentId', verifyToken, commentController.updateComment);


// Fake DELETE comment from server, meaning isDeleted is set to true, but the comment still exists.
// This is done to maintain the comment hierarchy and traceability of the content. The frontend will
// not display the actual content.
router.put('/:commentId/delete', verifyToken, commentController.fakeDeleteComment);

module.exports = router;
