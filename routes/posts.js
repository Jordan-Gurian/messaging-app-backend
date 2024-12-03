var express = require('express');
const postController = require('../controllers/postController');
const router = express.Router();
const verifyToken = require('../authentication/tokenUtils');

// GET posts from specific authors from server
router.get('/', postController.getPostsFromAuthors);

// GET specific post from server
router.get('/:postId', postController.getPost);

// POST new post to server
router.post('/', verifyToken, postController.postPost);

// PUT route to update post
router.put('/:postId', verifyToken, postController.updatePost);


// DELETE post from server
router.delete('/:postId', verifyToken, postController.deletePost);

module.exports = router;
