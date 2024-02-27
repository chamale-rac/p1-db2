const express = require('express')

module.exports = function (io) {
    const router = express.Router()
    const chatController = require('../controllers/chatController')(io)

    router.get('/messages/:userId', chatController.getLastChatsByUserId)
    router.get('/:id', chatController.getChatById)
    router.post('/message', chatController.newMessage)
    router.post('/getChatsMessagesMean', chatController.getUserMessagesMeanByChat)

    return router
}
