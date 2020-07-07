const jwt = require('jsonwebtoken')
const User = require('../models/user-model')

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decoded = jwt.verify(token, process.env.JWT_SECRET, (err, res) => {
            if (err) return err
            return res
        })
        const user = await User.findOne({ _id: decoded._id, 'tokens.token': token })
        console.log(user)
        if (!user) throw Error({ error: 'User Not Found' })
        req.token = token
        req.user = user
        next()
    } catch (e) {
        res.status(401).send({ error: 'Please Log-In!!!' })
    }
}

module.exports = auth 