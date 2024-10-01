var express = require('express');
const loginController = require('../controllers/loginController');
const router = express.Router();

// POST route to log in user
router.post('/', loginController.loginUser);

module.exports = router;
