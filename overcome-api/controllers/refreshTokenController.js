const jwt = require('jsonwebtoken')
const User = require('../models/userModel')

const handleRefreshToken = async (req, res) => {
    console.log('refresh token')
    try {
        const cookies = req.cookies

        if (!cookies?.jwt) {
            return res.sendStatus(401)
        }

        const refreshToken = await cookies.jwt
        const foundUser = await User.findOne({
            refreshToken: refreshToken,
        }).exec()

        if (!foundUser) {
            return res.status(403).json({ message: 'Forbidden' })
        }

        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            (err, user) => {
                if (err || foundUser.username !== user.username)
                    return res.sendStatus(403)
                const accessToken = jwt.sign(
                    { username: foundUser.username },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: '15min' }
                )
                return res.json({ accessToken })
            }
        )
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Server error' })
    }
}

module.exports = {
    handleRefreshToken,
}
