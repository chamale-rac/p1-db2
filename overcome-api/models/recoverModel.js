const mongoose = require('mongoose')

const recoverSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
    },
    unique_code: {
        type: String,
        required: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    is_verified: {
        type: Boolean,
        default: false,
    },
})

const Recover = mongoose.model('Recover', recoverSchema)

module.exports = Recover
