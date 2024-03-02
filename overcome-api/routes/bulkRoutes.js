const express = require('express')
const router = express.Router()
const multer = require('multer')
const fs = require('fs')

const User = require('../models/userModel')
const Event = require('../models/eventModel')
const Chat = require('../models/chatModel')

const upload = multer({ dest: 'uploads/' }) // specify the folder to store uploaded files

router.post(
    '/massiveEventsCreation/:userId',
    upload.single('file'),
    async (req, res) => {
        const userId = req.params.userId
        const file = req.file
        console.log('file :>> ', file)
        try {
            // Read the file and parse it to JSON
            const fileContent = fs.readFileSync(file.path, 'utf8')
            const eventsData = JSON.parse(fileContent)

            // Create chats for each event
            const chatOps = eventsData.map(() => ({
                insertOne: {
                    document: {
                        type: 'event',
                        messages: [],
                    },
                },
            }))
            const chatResult = await Chat.bulkWrite(chatOps)

            // Create events, using the chat IDs as references
            const eventOps = eventsData.map((eventData, index) => ({
                insertOne: {
                    document: {
                        title: eventData.title,
                        description: eventData.description,
                        date: new Date(eventData.date.$date), // Convert string date to Date object
                        duration: eventData.duration,
                        chat: chatResult.insertedIds[index], // Use the chat ID as a reference
                        hour: eventData.hour,
                        tags: eventData.tags,
                        link: eventData.link,
                        creator: userId,
                        limit: eventData.limit,
                    },
                },
            }))

            const eventResult = await Event.bulkWrite(eventOps)

            // Update each chat with the corresponding event ID
            const chatUpdateOps = Object.values(chatResult.insertedIds).map(
                (id, index) => ({
                    updateOne: {
                        filter: { _id: id },
                        update: {
                            $set: { event_id: eventResult.insertedIds[index] },
                        },
                    },
                })
            )
            await Chat.bulkWrite(chatUpdateOps)

            // Add event IDs to user's createdEvents
            const user = await User.findById(userId)
            user.createdEvents.push(...Object.values(eventResult.insertedIds))
            await user.save()

            // Delete the file after processing
            console.log('Deleting file:', file.path)
            fs.unlinkSync(file.path)

            res.json({ message: 'Events created successfully' })
        } catch (err) {
            console.error(err)
            res.status(500).json({ message: 'Error creating events' })
        }
    }
)

module.exports = router
