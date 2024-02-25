const jwt = require('jsonwebtoken')
const User = require('../models/userModel')
const bcrypt = require('bcrypt')

const generateToken = (User, duration) => {
    const payload = {
        username: User.username,
    }
    return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: duration,
    })
}

const comparePassword = async (plaintextPassword, hashedPassword) => {
    const isMatch = await bcrypt.compare(plaintextPassword, hashedPassword)
    return isMatch
}

const handleLogin = async (req, res) => {
    try {
        const { username, password } = req.body
        if (!username || !password) {
            return res
                .status(400)
                .json({ message: 'Username and password required' })
        }

        const foundUser = await User.findOne({ username })

        if (!foundUser) {
            return res.status(404).json({ message: 'User not found' })
        }

        const match = await comparePassword(password, foundUser.password)

        if (match) {
            const auth_token = jwt.sign(
                {
                    username: foundUser.username,
                    id: foundUser._id,
                    roles: foundUser.roles,
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15min' }
            )
            const refresh_token = jwt.sign(
                { username: foundUser.username },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '1d' }
            )

            foundUser.refreshToken = refresh_token
            const result = await foundUser.save()

            res.cookie('jwt', refresh_token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 24 * 60 * 60 * 1000,
            })
            res.json({
                message: `User ${foundUser.username} logged in successfully`,
                id: foundUser._id,
                username: foundUser.username,
                roles: foundUser.roles,
                auth_token,
            })
            return res
        } else {
            return res.status(401).json({ message: 'Invalid credentials' })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Server error' })
    }
}

module.exports = {
    handleLogin,
}
