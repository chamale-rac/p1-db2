const express = require('express')
const router = express.Router()
const eventController = require('../controllers/eventController')

router.get('/search', eventController.searchEvents)
router.get('/', eventController.getAllEvents)
router.get('/count', eventController.countEvents)
router.get('/:id', eventController.getEventById)
router.post('/', eventController.createEvent)
router.post('/joinEvent/:id', eventController.joinEvent)
router.post('/checkJoinedStatus/:id', eventController.checkUserJoinedStatus)
router.post('/removeJoinedEvent/:id', eventController.removeJoinedEvent)

router.delete('/:id', eventController.deleteEventById);

module.exports = router
