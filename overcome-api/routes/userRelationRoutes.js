const express = require('express')
const router = express.Router()
const userRelationController = require('../controllers/userRelationController')

router.get('/requests/:id', userRelationController.getAllRequests)
router.get('/friends/:id', userRelationController.getAllFriends)
router.post('/friendRequest', userRelationController.friendRequest)
router.post('/acceptFriendRequest', userRelationController.acceptFriendRequest)
router.post('/friendStatus', userRelationController.friendStatus)
router.post('/removeFriend', userRelationController.removeFriend);
module.exports = router
