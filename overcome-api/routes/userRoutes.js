const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')
const authMiddleware = require('../middleware/authMiddleware')

require('dotenv').config()

router.use(authMiddleware)
router.get('/', userController.getAllUsers)
router.get('/me', userController.getCurrentUser)
router.get('/saved-events/:id', userController.getUserSavedEvents)
router.get('/upcoming-events/:id', userController.getUserUpcomingEvents)
router.get('/:id', userController.getUserById)
router.post('/saveEvent', userController.saveEvent)

router.post('/joinEvent', userController.joinEvent)
router.post('/removeSavedEvent', userController.removeSavedEvent)
router.post('/removeJoinedEvent', userController.removeJoinedEvent)

router.post('/addFriend', userController.addFriend)
// TODO:fix, this is not secure, anyone can edit anyone's info
router.post('/editInfo/:id', userController.editInfo)

router.post('/checkEvent/:id', userController.checkUserEventStatus)

router.get('/getNotifications/:id', userController.getNotifications)
router.post('/updateNotifications/:id', userController.updateNotifications)

module.exports = router
