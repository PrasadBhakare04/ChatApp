const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

// All message routes are protected
router.use(auth);

// Message routes
router.post('/send', messageController.sendMessage);
router.get('/:userId', messageController.getChatHistory);

module.exports = router; 