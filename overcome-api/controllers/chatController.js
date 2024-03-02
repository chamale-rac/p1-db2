const Chat = require('../models/chatModel')
const Event = require('../models/eventModel')
const User = require('../models/userModel')
const jwt = require('jsonwebtoken')
const cookie = require('cookie')
const mongoose = require('mongoose');

const newMessage = async (req, res) => {
    try {
        const { chat_id, user_id, message } = req.body

        // verify user is part of chat
        const chat = await Chat.findById(chat_id)
        if (!chat.participants.includes(user_id)) {
            res.status(400).json({ message: 'User is not part of chat' })
        }

        const messageData = {
            user: user_id,
            message,
            sent_at: Date.now(),
        }

        const updatedChat = await Chat.findByIdAndUpdate(
            chat_id,
            { $push: { messages: messageData } },
            { new: true }
        )

        if (!updatedChat.participants.includes(user_id)) {
            updatedChat.participants.push(user_id)
        }

        const chatParticipants = updatedChat.participants.filter(
            (participant) => participant != user_id
        )

        // get username of based on user_id
        const user = await User.findById(user_id)
        const username = user.username

        let notificationData = {
            type: 'chat_private',
            message: `New message from ${username}!`,
            user_id,
            chat_id,
            username,
        }

        if (updatedChat.type === 'event') {
            // based on event_id get event title
            found_event = await Event.findById(updatedChat.event_id)
            notificationData.message = `New message on ${found_event.title}!`
            notificationData.event_id = updatedChat.event_id
            notificationData.type = 'chat_event'
        }

        await Promise.all(
            chatParticipants.map(async (participant) => {
                const updatedUser = await User.findByIdAndUpdate(
                    participant,
                    { $push: { notifications: notificationData } },
                    { new: true }
                )
            })
        )

        res.status(200).json(updatedChat)
    } catch (error) {
        console.error(error)
        res.status(500).send('Error updating chat')
    }
}

// function to add message to database with direct data from socket async (chat_id, user_id, message)
// same logic as newMessage but without the response and using params instead of body
const addMessage = async (chat_id, user_id, message) => {
    try {
        // verify user is part of chat
        const chat = await Chat.findById(chat_id)
        if (!chat.participants.includes(user_id)) {
            console.log('User is not part of chat')
        }

        const messageData = {
            user: user_id,
            message,
            sent_at: Date.now(),
        }

        const updatedChat = await Chat.findByIdAndUpdate(
            chat_id,
            { $push: { messages: messageData } },
            { new: true }
        )

        if (!updatedChat.participants.includes(user_id)) {
            updatedChat.participants.push(user_id)
        }

        const chatParticipants = updatedChat.participants.filter(
            (participant) => participant != user_id
        )

        // get username of based on user_id
        const user = await User.findById(user_id)
        const username = user.username

        let notificationData = {
            type: 'chat_private',
            message: `New message from ${username}!`,
            user_id,
            chat_id,
            username,
        }

        if (updatedChat.type === 'event') {
            // based on event_id get event title
            found_event = await Event.findById(updatedChat.event_id)
            notificationData.message = `New message on ${found_event.title}!`
            notificationData.event_id = updatedChat.event_id
            notificationData.type = 'chat_event'
        }

        await Promise.all(
            chatParticipants.map(async (participant) => {
                const updatedUser = await User.findByIdAndUpdate(
                    participant,
                    { $push: { notifications: notificationData } },
                    { new: true }
                )
            })
        )
    } catch (error) {
        console.error(error)
    }
}

const getUserMessagesMeanByChat = async (req, res) => {
    try {
        const { userId } = req.body

        console.log('chatsMean:', userId)

        const userMessagesMeanByChat = await Chat.aggregate([
            { $match: { participants: new mongoose.Types.ObjectId(userId) } },
            { $unwind: '$messages' },
            { $group: { _id: '$_id', count: { $sum: 1 } } },
            { $group: { _id: null, mean: { $avg: '$count' } } }
        ])
        
        res.status(200).json(userMessagesMeanByChat)
    } catch (error) {
        console.log("Error getting mean.", error)
        res.status(500).json({ message: "Error getting mean." })
    }
}

module.exports = function (io) {
    const chat = io.of('/chat')

    chat.use((socket, next) => {
        if (socket.request.headers.cookie) {
            const cookies = cookie.parse(socket.request.headers.cookie)
            const token = cookies['jwt'] // replace 'your-token-cookie-name' with the name of your token cookie
            if (token) {
                try {
                    const decoded = jwt.verify(
                        token,
                        process.env.REFRESH_TOKEN_SECRET
                    )

                    socket.user = decoded
                    next()
                } catch (error) {
                    console.log(error)
                    next(new Error('Invalid token'))
                }
            } else {
                next(new Error('No token provided'))
            }
        } else {
            next(new Error('No token provided'))
        }
    })

    chat.on('connection', (socket) => {
        socket.on('message', (message) => {
            console.log('New message received: ', message)
            socket.broadcast.emit('receive-message', {
                message: message.message,
                user: {
                    username: socket.user.username,
                    _id: message.user_id,
                },
                sent_at: Date.now(),
                _id: message._id,
            })

            addMessage(message.chat_id, message.user_id, message.message)
        })

        // socket.on('disconnect', () => {
        //     console.log('user disconnected from chat')
        // })
    })

    return {
        newMessage: newMessage,
        getUserMessagesMeanByChat: getUserMessagesMeanByChat,
        getLastChatsByUserId: async function (req, res) {
            try {
                const { userId } = req.params
                const response = await Chat.find({ 'messages.user': userId })
                    .populate('messages.user', 'username')
                    .sort({ 'messages.sent_at': -1 })

                const recentChats = response.map((chat) => {
                    const lastMessage = chat.messages.sort(
                        (a, b) => new Date(b.sent_at) - new Date(a.sent_at)
                    )

                    return Event.findOne({ chat: chat._id })
                        .then((event) => {
                            if (lastMessage) {
                                return {
                                    _id: chat._id,
                                    event: event._id,
                                    eventTitle: event.title,
                                    messages: [...lastMessage.slice(0, 3)],
                                }
                            }
                            return null
                        })
                        .catch((error) => {
                            return null
                        })
                })

                Promise.all(recentChats)
                    .then((chats) => {
                        res.status(200).json(chats.slice(0, 3))
                    })
                    .catch((error) => {
                        res.status(500).send(
                            'Error fetching chats from database'
                        )
                    })
            } catch (error) {
                res.status(500).send('Error fetching chats from database')
            }
        },

        getChatById: async function (req, res) {
            try {
                const chat = await Chat.findById(req.params.id).populate(
                    'messages.user',
                    'username'
                )
                res.status(200).json(chat)
            } catch (error) {
                'chat error', error
                res.status(500).send('Error fetching chat from database')
            }
        },
    }
}

// const getChatById = async (req, res) => {
//     try {
//         const chat = await Chat.findById(req.params.id).populate(
//             'messages.user',
//             'username'
//         )
//         res.status(200).json(chat)
//     } catch (error) {
//         'chat error', error
//         res.status(500).send('Error fetching chat from database')
//     }
// }

// const newMessage = async (req, res) => {
//     try {
//         const { chat_id, user_id, message } = req.body

//         // verify user is part of chat
//         const chat = await Chat.findById(chat_id)
//         if (!chat.participants.includes(user_id)) {
//             res.status(400).json({ message: 'User is not part of chat' })
//         }

//         const messageData = {
//             user: user_id,
//             message,
//             sent_at: Date.now(),
//         }

//         const updatedChat = await Chat.findByIdAndUpdate(
//             chat_id,
//             { $push: { messages: messageData } },
//             { new: true }
//         )

//         if (!updatedChat.participants.includes(user_id)) {
//             updatedChat.participants.push(user_id)
//         }

//         const chatParticipants = updatedChat.participants.filter(
//             (participant) => participant != user_id
//         )

//         // get username of based on user_id
//         const user = await User.findById(user_id)
//         const username = user.username

//         let notificationData = {
//             type: 'chat_private',
//             message: `New message from ${username}!`,
//             user_id,
//             chat_id,
//             username,
//         }

//         if (updatedChat.type === 'event') {
//             // based on event_id get event title
//             found_event = await Event.findById(updatedChat.event_id)
//             notificationData.message = `New message on ${found_event.title}!`
//             notificationData.event_id = updatedChat.event_id
//             notificationData.type = 'chat_event'
//         }

//         await Promise.all(
//             chatParticipants.map(async (participant) => {
//                 const updatedUser = await User.findByIdAndUpdate(
//                     participant,
//                     { $push: { notifications: notificationData } },
//                     { new: true }
//                 )
//             })
//         )

//         res.status(200).json(updatedChat)
//     } catch (error) {
//         console.error(error)
//         res.status(500).send('Error updating chat')
//     }
// }

// const getLastChatsByUserId = async (req, res) => {
//     try {
//         const { userId } = req.params

//         const response = await Chat.find({ 'messages.user': userId })
//             .populate('messages.user', 'username')
//             .sort({ 'messages.sent_at': -1 })

//         const recentChats = response.map((chat) => {
//             const lastMessage = chat.messages.sort(
//                 (a, b) => new Date(b.sent_at) - new Date(a.sent_at)
//             )

//             return Event.findOne({ chat: chat._id })
//                 .then((event) => {
//                     if (lastMessage) {
//                         return {
//                             _id: chat._id,
//                             event: event._id,
//                             eventTitle: event.title,
//                             messages: [...lastMessage.slice(0, 3)],
//                         }
//                     }
//                     return null
//                 })
//                 .catch((error) => {
//                     return null
//                 })
//         })

//         Promise.all(recentChats)
//             .then((chats) => {
//                 res.status(200).json(chats.slice(0, 3))
//             })
//             .catch((error) => {
//                 res.status(500).send('Error fetching chats from database')
//             })
//     } catch (error) {
//         res.status(500).send('Error fetching chats from database')
//     }
// }

// module.exports = {
//     getChatById,
//     newMessage,
//     getLastChatsByUserId,
// }
