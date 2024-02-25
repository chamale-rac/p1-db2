const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const bcrypt = require('bcrypt')

const handleNewUser = async (req, res) => {
    const { username, password } = req.body
    if (!username || !password)
        return res
            .status(400)
            .json({ message: 'Username and password are required' })

    const duplicate = await User.findOne({ username: username }).exec()

    if (duplicate)
        return res.status(409).json({ message: 'Username already exists' })

    try {
        const { username, name, lastname, email, password } = req.body
        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Create and store the user in the database
        const result = await User.create({
            username: username,
            name: name,
            lastname: lastname,
            email: email,
            password: hashedPassword,
        })

        res.status(201).json({
            message: `User ${username} created successfully`,
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error' })
    }
}

module.exports = {
    handleNewUser,
}
