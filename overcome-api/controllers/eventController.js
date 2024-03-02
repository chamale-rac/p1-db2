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

        // add event id to user createdEvents
        const user = await User.findById(req.body.creator)
        user.createdEvents.push(event._id)
        await user.save()

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
    const { search = '', user_id, offset = 0, limit = 30 } = req.query
    const {
        tags,
        startDate,
        endDate,
        dateSort,
        durationSort,
        joinable,
        suggestions,
    } = req.body
    console.log('tags', tags)
    console.log('joinable', joinable)
    console.log('suggestionssss', suggestions)
    try {
        let pipeline = []
        if (suggestions) {
            console.log('suggestions', suggestions)
            // Case when search is empty, use user's interests and favorite games
            const user = await User.findById(user_id)
            const userTags = [...user.interests, ...user.favorites]

            pipeline.push({
                $match: {
                    tags: { $in: userTags.map((tag) => new RegExp(tag, 'i')) },
                },
            })
        }

        // regex search based on search match with title
        if (search !== '') {
            console.log('search', search)
            pipeline.push({
                $match: {
                    title: { $regex: search, $options: 'i' },
                },
            })
        }

        // Case when search is not empty, use all the tags, startDate, endDate, dateSort, durationSort, and joinable
        let matchQuery = {}
        if (tags.length > 0) {
            console.log('tagsasd', tags)
            matchQuery.tags = { $in: tags.map((tag) => new RegExp(tag, 'i')) }
        }

        if (startDate && endDate) {
            const start = new Date(startDate)
            const end = new Date(endDate)
            console.log('start', start)
            console.log('end', end)

            if (start > end) {
                return res
                    .status(400)
                    .send(
                        'Invalid date range. Start date must be less than or equal to end date.'
                    )
            }
            matchQuery.date = {
                $gte: start,
                $lte: end,
            }
        }

        if (joinable) {
            matchQuery.$expr = {
                $lt: [{ $size: '$participants' }, '$limit'],
            } // This means that the event is joinable, cause the number of participants is less than the limit
        } else {
            matchQuery.$expr = {
                $eq: [{ $size: '$participants' }, '$limit'],
            } // This means that the event is not joinable, cause the number of participants is equal to the limit
        }

        pipeline.push({ $match: matchQuery })

        // Get total results before applying offset and limit
        const totalResults = await Event.aggregate([
            ...pipeline,
            { $count: 'totalResults' },
        ])

        let sort = {}
        // Apply sorting
        if (dateSort) {
            sort.date = parseInt(dateSort)
        }
        if (durationSort) {
            sort.duration = parseInt(durationSort)
        }
        if (Object.keys(sort).length > 0) {
            pipeline.push({ $sort: sort })
        }

        // Apply offset and limit
        pipeline.push({ $skip: parseInt(offset) }, { $limit: parseInt(limit) })

        // Perform the search using the built pipeline
        const events = await Event.aggregate(pipeline)

        res.json({
            events,
            totalResults: totalResults.length
                ? totalResults[0].totalResults
                : 0,
        })
    } catch (error) {
        console.error(error)
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
                user.createdEvents = user.createdEvents.filter(
                    (createdEvent) => createdEvent != eventId
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
