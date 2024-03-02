const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const bcrypt = require('bcrypt')
var cloudinary = require('cloudinary').v2
const mongoose = require('mongoose')

const getAllUsers = async (req, res) => {
    const {
        offset = 0,
        limit = 30,
        search = '',
        suggest_by,
        user_id,
    } = req.query

    try {
        let matchStage = {}
        if (search !== '') {
            matchStage = {
                $or: [
                    { username: { $regex: search, $options: 'i' } },
                    { name: { $regex: search, $options: 'i' } }, // regex is the query for searching
                    { lastname: { $regex: search, $options: 'i' } }, // case insensitive
                ],
            }
        } else {
            const user = await User.findById(user_id)
            if (user) {
                matchStage = {
                    $or: [
                        { interests: { $in: user.interests } },
                        { favorites: { $in: user.favorites } },
                    ],
                }
            }
        }

        const total = await User.countDocuments(matchStage)
        const users = await User.aggregate([
            { $match: matchStage },
            { $project: { _id: 1, email: 1, username: 1 } },
            { $skip: parseInt(offset) },
            { $limit: Math.min(parseInt(limit), 300) },
        ])

        res.status(200).json({ users, total })
    } catch (error) {
        console.error(error)
        res.status(500).send('Error fetching users from database')
    }
}

const getUserById = async (req, res) => {
    req.params
    try {
        const user = await User.findOne({ _id: req.params.id })
            .populate('savedEvents')
            .populate('createdEvents')
            .populate('joinedEvents')
            .populate('interests')
            .populate('favorites')
        res.status(200).json(user)
    } catch (error) {
        console.error(error)
        res.status(500).send('Error fetching user from database')
    }
}

const getCurrentUser = async (req, res) => {
    req.user
    try {
        const user = await User.findOne({ _id: req.user._id })

        res.status(200).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
        })
    } catch (error) {
        console.error(error)
        res.status(500).send('Error fetching user from database')
    }
}

const saveEvent = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.user_id })
        user.savedEvents.push(req.body.event_id)
        await user.save()
        res.status(200).json(user)
    } catch (error) {
        console.error(error)
        res.status(500).send('Error saving event to user')
    }
}

const joinEvent = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.user_id })
        user.joinedEvents.push(req.body.event_id)
        await user.save()
        res.status(200).json(user)
    } catch (error) {
        console.error(error)
        res.status(500).send('Error joinning event to user')
    }
}

const addFriend = async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.user_id })
        user.friends.push(req.body.friend_id)
        await user.save()
        res.status(200).json(user)
    } catch (error) {
        console.error(error)
        res.status(500).send('Error saving event to user')
    }
}

const getCommonFriends = async (req, res) => {
    try {
        const { userId1, userId2 } = req.body

        const commonFriends = await User.aggregate([
            {
                $match: {
                    _id: {
                        $in: [
                            new mongoose.Types.ObjectId(userId1),
                            new mongoose.Types.ObjectId(userId2),
                        ],
                    },
                },
            },
            {
                $unwind: '$relations',
            },
            {
                $match: {
                    'relations.state': 'accepted',
                },
            },
            {
                $group: {
                    _id: '$relations.user',
                    count: { $sum: 1 },
                },
            },
            {
                $match: {
                    count: { $eq: 2 },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            {
                $unwind: '$user',
            },
            {
                $replaceRoot: { newRoot: '$user' },
            },
        ])

        res.json(commonFriends)
    } catch (error) {
        console.log('Error getting common friends.', error)
        res.status(500).json({ message: 'Error getting common friends.' })
    }
}

const editInfo = async (req, res) => {
    // TODO: fix, this is not secure, anyone can edit anyone's info
    /**
     * Editable fields:
     * - name
     * - lastname
     * - email
     * - password
     * - profilePicture
     */
    const {
        name,
        lastname,
        email,
        password,
        profilePicture,
        interestsArray,
        favoritesArray,
    } = req.body
    const userId = req.params.id

    try {
        const user = await User.findById(userId)

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        user.name = name ?? user.name
        user.lastname = lastname ?? user.lastname
        user.email = email ?? user.email
        user.password = password ?? user.password
        user.interests = interestsArray ?? user.interests
        user.favorites = favoritesArray ?? user.favorites

        if (profilePicture) {
            try {
                const result = await cloudinary.uploader.upload(
                    profilePicture,
                    {
                        folder: 'profile_pictures',
                    }
                )

                console.log(result.secure_url)
                user.profilePicture = result.secure_url
            } catch (error) {
                console.error(error)
                return res
                    .status(500)
                    .json({ message: 'Internal server error' })
            }
        }
        try {
            await user.save()
            return res
                .status(200)
                .json({ message: 'User updated successfully' })
        } catch (error) {
            console.error(error)
            return res.status(500).json({ message: 'Internal server error' })
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal server error' })
    }
}

// Check if some event is saved by the user
const checkUserEventStatus = async (req, res) => {
    const user_id = req.params.id
    const eventId = req.body.event_id

    try {
        const user = await User.findById(user_id)

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        const savedEvents = user.savedEvents.map((event) => event.toString())

        if (savedEvents.includes(eventId)) {
            res.status(200).json({ saved: true })
        } else {
            res.status(200).json({ saved: false })
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal server error' })
    }
}

const getUserSavedEvents = async (req, res) => {
    try {
        const { id } = req.params

        const events = await User.findById(id).populate('savedEvents')

        res.status(200).json(events)
    } catch (error) {
        res.status(500).send('Error fetching events from database')
    }
}

const getUserUpcomingEvents = async (req, res) => {
    try {
        const { id } = req.params

        const events = await User.findById(id).populate({
            path: 'savedEvents',
            options: {
                sort: { date: -1 },
                limit: 3,
            },
        })

        res.status(200).json(events)
    } catch (error) {
        res.status(500).send('Error fetching events from database')
    }
}

const getNotifications = async (req, res) => {
    try {
        const { id } = req.params
        const user = await User.findById(id)

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        const notifications = user.notifications.filter(
            (notification) => notification.show
        )

        const unreadCount = user.notifications.filter(
            (notification) => notification.show && !notification.read
        ).length

        // Sort notifications by date, descending
        notifications.sort((a, b) => b.date - a.date)

        res.status(200).json({ notifications, unreadCount })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal server error' })
    }
}

const updateNotifications = async (req, res) => {
    try {
        const { id } = req.params
        const { notifications } = req.body

        const user = await User.findById(id)

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        notifications.forEach((notification) => {
            const index = user.notifications.findIndex(
                (n) => n._id.toString() === notification._id
            )
            if (index !== -1) {
                user.notifications[index] = notification
            }
        })

        await user.save()

        res.status(200).json({ message: 'Notifications updated successfully' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Internal server error' })
    }
}

const removeSavedEvent = async (req, res) => {
    try {
        const { user_id, event_id } = req.body

        const user = await User.findOne({ _id: user_id })

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        const eventIndex = user.savedEvents.findIndex(
            (eventId) => eventId.toString() === event_id
        )

        if (eventIndex !== -1) {
            user.savedEvents.splice(eventIndex, 1)
            await user.save()

            res.status(200).json({ message: 'Event removed from saved events' })
        } else {
            res.status(404).json({ message: 'Event not found in saved events' })
        }
    } catch (error) {
        res.status(500).json({ message: err.message })
    }
}

const removeJoinedEvent = async (req, res) => {
    try {
        const { user_id, event_id } = req.body

        const user = await User.findOne({ _id: user_id })

        if (!user) {
            return res.status(404).json({ message: 'User not found' })
        }

        const eventIndex = user.joinedEvents.findIndex(
            (eventId) => eventId.toString() === event_id
        )

        if (eventIndex !== -1) {
            user.joinedEvents.splice(eventIndex, 1)
            await user.save()

            res.status(200).json({
                message: 'Event removed from joined events',
            })
        } else {
            res.status(404).json({
                message: 'Event not found in joined events',
            })
        }
    } catch (error) {
        res.status(500).json({ message: err.message })
    }
}

module.exports = {
    getAllUsers,
    getUserById,
    getCurrentUser,
    saveEvent,
    addFriend,
    editInfo,
    checkUserEventStatus,
    getUserSavedEvents,
    getNotifications,
    updateNotifications,
    removeSavedEvent,
    joinEvent,
    removeJoinedEvent,
    getUserUpcomingEvents,
    getCommonFriends,
}
