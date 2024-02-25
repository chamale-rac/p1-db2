const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    description: { type: String, required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    date: { type: Date, required: true, default: Date.now },
    duration: { type: Number, required: false },
    hour: {
        type: String,
        required: true,
        validate: {
            validator: function (value) {
                // Validate that the hour string has a valid format of "HH:mm"
                const pattern = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/
                return pattern.test(value)
            },
            message: (props) =>
                `${props.value} is not a valid time in the format HH:mm!`,
        },
    },
    link: { type: String, required: false },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
    tags: [{ type: String }],
    limit: { type: Number, required: false },
})

const Event = mongoose.model('Event', eventSchema)

module.exports = Event
