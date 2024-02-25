const Event = require('../models/eventModel')
const Chat = require('../models/chatModel')
const User = require('../models/userModel')
const Report = require('../models/reportModel')
const reportController = require('./reportController')

const getAllEvents = async (req, res) => {
    try {
        const { offset = 0, limit = 15 } = req.query
        const events = await Event.find({})
            .skip(parseInt(offset))
            .limit(parseInt(limit))
            .populate('participants', 'username')
            .populate('creator', 'username')
        res.status(200).json(events)
    } catch (error) {
        res.status(500).send('Error fetching events from database')
    }
}

const countEvents = async (req, res) => {
    try {
        const count = await Event.countDocuments({})
        res.status(200).json(count)
    } catch (error) {
        res.status(500).send('Error counting events from database')
    }
}

const createEvent = async (req, res) => {
    try {
        // Create the chat associated with the event
        const chat = await Chat.create({
            type: 'event',
            messages: [],
        })

        // Create the event, using the chat ID as a reference
        const event = await Event.create({
            title: req.body.title,
            description: req.body.description,
            date: req.body.date,
            duration: req.body.duration,
            chat: chat._id, // Use the chat ID as a reference
            hour: req.body.hour,
            tags: req.body.tags,
            link: req.body.link,
            creator: req.body.creator,
            limit: req.body.limit,
        })

        // add event id to chat
        chat.event_id = event._id

        const event_id = event._id

        await chat.save()

        res.status(201).json({
            id: event_id,
        })
    } catch (error) {
        console.error(error)
        res.status(500).send('Error creating event')
    }
}

//get event by id
const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('participants', 'username')
            .populate('creator', 'username')
        res.status(200).json(event)
    } catch (error) {
        res.status(500).send('Error fetching event from database')
    }
}

const searchEvents = async (req, res) => {
    const { title, tags, startDate, endDate } = req.query

    try {
        const query = {}

        // Build the query based on the user's input
        if (title) {
            // Search by title (case-insensitive)
            query.title = { $regex: new RegExp(title, 'i') }
        }

        if (tags) {
            // Search by tags (split by comma and remove leading/trailing spaces)
            const tagsArray = tags.split(',').map((tag) => tag.trim())
            query.tags = { $in: tagsArray }
        }

        if (startDate && endDate) {
            // Search by date range
            query.date = { $gte: startDate, $lte: endDate }
        }

        // Perform the search using the built query
        const events = await Event.find(query)

        res.json(events)
    } catch (error) {
        error
        res.status(500).send('Error fetching events from the database')
    }
}

const joinEvent = async (req, res) => {
    try {
        const eventId = req.params.id // Get the event ID from the request parameters
        const userId = req.body.userId // Get the user ID from the request body

        // Find the event by ID
        const event = await Event.findById(eventId)

        // Check if the user is already a participant in the event
        if (event.participants.includes(userId)) {
            res.status(400).json({
                message: 'User is already a participant in this event',
            })
        } else {
            if (event.limit && event.participants.length >= event.limit) {
                res.status(400).json({
                    message: 'Event has reached the participant limit',
                })
            } else {
                // Add the user to the participants array and save the updated event
                event.participants.push(userId)
                await event.save()

                // update chat participants
                const chat = await Chat.findById(event.chat)
                chat.participants.push(userId)
                await chat.save()

                // Populate the participant and creator fields of the updated event
                const populatedEvent = await Event.findById(eventId)
                    .populate('participants', 'username')
                    .populate('creator', 'username')

                res.status(200).json(populatedEvent)
            }
        }
    } catch (error) {
        console.error(error)
        res.status(500).send('Error joining event')
    }
}

const checkUserJoinedStatus = async (req, res) => {
    try {
        const eventId = req.params.id
        const userId = req.body.userId

        const event = await Event.findById(eventId)

        if (event.participants.includes(userId)) {
            res.status(200).json({ joined: true })
        } else {
            res.status(200).json({ joined: false })
        }
    } catch (error) {
        console.log(error)
        res.status(500).send('Error checking user joined status')
    }
}

const removeJoinedEvent = async (req, res) => {
    try {
        const eventId = req.params.id // Get the event ID from the request parameters
        const userId = req.body.userId // Get the user ID from the request body

        // Remove the user from the participants array using $pull
        const updatedEvent = await Event.findByIdAndUpdate(
            eventId,
            { $pull: { participants: userId } },
            { new: true }
        )
            .populate('participants', 'username')
            .populate('creator', 'username')

        if (!updatedEvent) {
            res.status(404).json({ message: 'Event not found' })
        } else {
            // update chat participants
            const chat = await Chat.findById(updatedEvent.chat)
            chat.participants = chat.participants.filter(
                (participant) => participant != userId
            )
            await chat.save()

            res.status(200).json(updatedEvent)
        }
    } catch (error) {
        console.error(error)
        res.status(500).send('Error removing user from event')
    }
}

const deleteEventById = async (req, res) => {
    try {
        const eventId = req.params.id

        // Busca el evento por su ID
        const event = await Event.findById(eventId)

        if (!event) {
            return res.status(404).json({ message: 'Event not found' })
        }

        // Elimina las referencias del evento en la lista de eventos de los participantes
        const participants = event.participants || []
        const promises = participants.map(async (participantId) => {
            const user = await User.findById(participantId)
            if (user) {
                user.savedEvents = user.savedEvents.filter(
                    (savedEvent) => savedEvent != eventId
                )
                user.joinedEvents = user.joinedEvents.filter(
                    (joinedEvent) => joinedEvent != eventId
                )
                await user.save()
            }
        })

        // Elimina el chat asociado al evento si existe
        if (event.chat) {
            await Chat.findByIdAndRemove(event.chat)
        }

        // Delete any Report that have eventId
        await reportController.deleteEventReports(eventId)

        // Elimina el evento y las referencias en las relaciones
        await Event.deleteOne({ _id: eventId })
        // Envía una respuesta exitosa
        res.status(200).json({ message: 'Event deleted!' })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}

module.exports = {
    getAllEvents,
    countEvents,
    createEvent,
    getEventById,
    searchEvents,
    joinEvent,
    checkUserJoinedStatus,
    removeJoinedEvent,
    deleteEventById,
}
