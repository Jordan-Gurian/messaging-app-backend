var express = require('express');
const chatController = require('../controllers/chatController');
const router = express.Router();
const verifyToken = require('../authentication/tokenUtils');


// GET all chats from server
router.get('/', chatController.getAllChats);

// GET specific chat from server
router.get('/:chatId', verifyToken, chatController.getChat);

// POST new chat to server
router.post('/', verifyToken, chatController.postChat);

// DELETE chat from server
router.delete('/:chatId', verifyToken, chatController.deleteChat);

module.exports = router;
