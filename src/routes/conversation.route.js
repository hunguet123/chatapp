const express = require('express');
const path = require('path')
const router = express.Router();
const conversationController = require('../controllers/conversation.controller');
const checkSession = require('../middlewares/check-session.js');

router.get('/all', checkSession, conversationController.viewAllConversations);
router.get('/box/:id', checkSession, conversationController.chatBox);
router.get('/', checkSession, conversationController.viewChatMenu);
router.get('/box/video-call/:id', checkSession, conversationController.videoCall);

module.exports = router;