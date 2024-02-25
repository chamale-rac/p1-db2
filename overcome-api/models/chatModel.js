const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    ],

    type: { type: String, required: true },
    event_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
    },
    messages: [
        {
            message: { type: String, required: true },
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true,
            },
            sent_at: { type: Date, required: true, default: Date.now },
        },
    ],
})

const Chat = mongoose.model('Chat', chatSchema)

module.exports = Chat

// TODO add chat_id in order to get the chat from the event o the user
