var express = require('express');
const messageController = require('../controllers/messageController');
const router = express.Router();
const verifyToken = require('../authentication/tokenUtils');


// GET all messages from server
router.get('/', messageController.getAllMessages);

// GET specific message from server
router.get('/:messageId', verifyToken, messageController.getMessage);

// POST new message to server
router.post('/', verifyToken, messageController.postMessage);

// DELETE message from server
router.delete('/:messageId', verifyToken, messageController.deleteMessage);

module.exports = router;
