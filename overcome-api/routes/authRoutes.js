const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const logoutController = require('../controllers/logoutController')

router.post('/login', authController.handleLogin)
router.get('/logout', logoutController.handleLogout)

module.exports = router
