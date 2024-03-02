const multer = require('multer')
const { GridFsStorage } = require('multer-gridfs-storage')
const mongoose = require('mongoose')

require('dotenv').config()

// create a connection to MongoDB
const connection = mongoose.createConnection(process.env.DATABASE_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

// Create storage engine for multer-gridfs-storage
const storage = new GridFsStorage({
    url: process.env.DATABASE_URI,
    file: (req, file) => {
        // Generate a unique file name, you can use any method to generate it.
        // In this example we are using Date.now() to generate unique name
        const filename = `${Date.now()}_${file.originalname}`
        // Create an object containing the file information
        // It will be used by multer-gridfs-storage to save the file in MongoDB
        const fileInfo = {
            filename: filename,
            bucketName: 'images', // specify the bucket name
        }
        return fileInfo
    },
})

const imageFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        // Create an error message to be returned in case validation fails
        req.fileValidationError =
            'Invalid image format. Only jpeg, jpg, png and gif images are allowed.'
        return cb(new Error('Invalid image format'), false)
    }
    cb(null, true)
}

// Create a multer instance with the storage and fileFilter options
const upload = multer({ storage, fileFilter: imageFilter })

module.exports = upload
