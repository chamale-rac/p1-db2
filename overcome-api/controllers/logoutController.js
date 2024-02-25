const User = require('../models/userModel')

const handleLogout = async (req, res) => {
    // Before logging out, we need to delete the access token in the frontend
    // and the refresh token in the backend

    const cookies = req.cookies
    if (!cookies?.jwt) {
        return res.sendStatus(204)
    }
    const refreshToken = cookies.jwt
    const foundUser = await User.findOne({ refreshToken: refreshToken })

    if (!foundUser) {
        res.clearCookie('jwt', { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 })
        return res.sendStatus(204)
    }

    // Delete the refresh token from the database
    const result = await User.findOneAndUpdate(
        { username: foundUser.username },
        { refreshToken: '' },
        { new: true }
    )(result)
    res.clearCookie('jwt', {
        httpOnly: true,
        sameSite: 'None',
        secure: true,
    })
    res.sendStatus(204)
}

module.exports = {
    handleLogout,
}
