const express = require('express')
const router = express.Router()

const User = require('../models/userModel')
const mongoose = require('mongoose')

const multer = require('multer')
const { GridFsStorage } = require('multer-gridfs-storage')

const storage = new GridFsStorage({
    url: process.env.DATABASE_URI,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        const user_id = req.params.id
        return {
            filename: file.originalname,
            metadata: { uploadedBy: user_id },
            bucketName: 'profilePhotos', // This is the name of the GridFS collection
        }
    },
})

const upload = multer({ storage })

router.post('/upload/:id', upload.single('image'), async (req, res) => {
    if (req.fileValidationError) {
        return res.status(400).json({
            message: req.fileValidationError,
        })
    }

    try {
        // update the user's profilePicture field with the id of the uploaded file
        await User.findOneAndUpdate(
            { _id: req.params.id },
            { profilePicture: req.file.id },
            { new: true }
        )

        return res.json({
            message: 'File uploaded successfully',
            file: req.file,
        })
    } catch (err) {
        return res.status(500).json({ message: 'Error updating user' })
    }
})

router.get('/image/:id', (req, res) => {
    console.log('Getting image')
    let fileId
    try {
        fileId = new mongoose.Types.ObjectId(req.params.id)
        console.log('File ID:', fileId)
    } catch (err) {
        console.log('Invalid ID:', err)
        return res.status(400).json({
            message:
                'Invalid PhotoID in URL parameter. Must be a single String of 12 bytes or a string of 24 hex characters',
        })
    }

    console.log('Creating bucket')
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'profilePhotos',
    })

    console.log('Opening download stream')
    let downloadStream = bucket.openDownloadStream(fileId)

    downloadStream.on('data', (chunk) => {
        console.log('Received data chunk')
        console.log(chunk)
        res.write(chunk)
    })

    downloadStream.on('error', (error) => {
        console.log('Error:', error)
        res.sendStatus(404)
    })

    downloadStream.on('end', () => {
        console.log('Stream ended')
        res.end()
    })
})

module.exports = router
