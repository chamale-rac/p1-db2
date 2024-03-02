const express = require('express')
const app = express()
const mongoose = require('mongoose')
const userRoutes = require('./routes/userRoutes')
const authRoutes = require('./routes/authRoutes')
const register = require('./routes/register')
const refresh = require('./routes/refresh')
const eventRoutes = require('./routes/eventRoutes')
const userRelationRoutes = require('./routes/userRelationRoutes')
const recoverRoutes = require('./routes/recoverRoutes')
const reportRoutes = require('./routes/reportRoutes')
const imageRoutes = require('./routes/imageRoutes')

const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const cors = require('cors')
var cloudinary = require('cloudinary').v2

require('dotenv').config()

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})
const http = require('http')

app.use(
    cors({
        origin: `${process.env.CLIENT_URL}`,
        credentials: true,
    })
)

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', `${process.env.CLIENT_URL}`)
    res.header('Access-Control-Allow-Credentials', true)
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    res.header('Access-Control-Allow-Headers', '*')

    next()
})

app.use(express.json({ limit: '5mb' }))

app.use(cookieParser())

app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/register', register)
app.use('/refresh', refresh)
app.use('/events', eventRoutes)
app.use('/relations', userRelationRoutes)
app.use('/recover', recoverRoutes)
app.use('/reports', reportRoutes)
app.use('/users', imageRoutes)
app.use('/images', imageRoutes)

/*
Checking middleware
app.use((req, res, next) => {
    (req.headers.cookie)
    (req.cookies)
    next()
})
*/

mongoose
    .connect(process.env.DATABASE_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .catch((err) => console.error(err))

const server = http.createServer(app)
const io = require('socket.io')(server, {
    cors: {
        origin: `${process.env.CLIENT_URL}`,
        credentials: true,
    },
})

mongoose.connection.once('open', () => {
    server.listen(process.env.PORT, () => {
        console.log('Server is running on port', server.address().port)
    })
})

const chatRoutes = require('./routes/chatRoutes')(io)
app.use('/chats', chatRoutes)

module.exports = app
