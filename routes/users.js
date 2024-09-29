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

// DELETE user from server
router.delete('/:userId', verifyToken, userController.deleteUser);

module.exports = router;
