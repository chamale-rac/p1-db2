function checkRole(role) {
    return function (req, res, next) {
        const roles = req.user.roles
        if (roles[role]) {
            next()
        } else {
            res.status(403).send('Forbidden')
        }
    }
}

module.exports = checkRole
