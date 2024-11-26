var express = require('express');
const userController = require('../controllers/userController');
const router = express.Router();
const verifyToken = require('../authentication/tokenUtils');


// GET all users from server
router.get('/', userController.getAllUsers);

// GET specific user from server
router.get('/:userId', userController.getUser);

// POST new user to server
router.post('/', userController.postUser);

// PUT route to update user profile by id
router.put('/:userId', verifyToken, userController.updateUserProfile);

// PUT route to update user following by id
router.put('/:userId/follow', verifyToken, userController.updateUserFollow);

// DELETE user from server
router.delete('/:userId', verifyToken, userController.deleteUser);

module.exports = router;
