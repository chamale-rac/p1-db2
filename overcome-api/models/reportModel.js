const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema({
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    revisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    reportSubmit: {
        type: Date,
        default: Date.now,
    },
    reviseSubmit: {
        type: Date,
    },
    type: {
        type: String,
        required: true,
        enum: ['Event', 'User'],
    },
    reportFor: {
        type: String,
        required: true,
        enum: [
            'Me',
            'Another person or a specific group of people',
            'This affects everyone',
        ],
    },
    whatIsGoingOn: {
        type: String,
        required: true,
        enum: [
            'Identity attack',
            'Harassment or intimidation with violence',
            'Spam',
            'Impersonation',
            'Self-harm',
            'Sensitive or disturbing content',
            'Deceptive solicitation',
        ],
    },
    comments: {
        type: String,
        required: false,
    },
    status: {
        type: String,
        required: true,
        enum: ['Open', 'Under Review', 'Closed'],
        default: 'Open',
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
    },
    perpetrator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
})

const Reports = mongoose.model('Reports', reportSchema)

module.exports = Reports
