const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.status(401).json({ message: 'Unauthorized' })
    }

    authHeader // yep here is the bearer token
    const token = authHeader.split(' ')[1]
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        req.user = decoded
        next()
    } catch (error) {
        error
        res.status(403).json({ message: 'Invalid Token' })
    }
}

module.exports = authMiddleware
