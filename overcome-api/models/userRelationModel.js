const mongoose = require('mongoose')

const userRelationSchema = new mongoose.Schema({
    user1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    user2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    first_user_agreement: { type: Boolean, default: false },
    second_user_agreement: { type: Boolean, default: false },
    chat_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
})

// Add the unique index
userRelationSchema.index({ user1: 1, user2: 1 }, { unique: true })

const userRelation = mongoose.model('UserRelation', userRelationSchema)

module.exports = userRelation
