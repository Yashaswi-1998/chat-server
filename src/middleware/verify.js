const jwt = require('jsonwebtoken')

const verify = async (req, res, next) => {
    try {
        const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET, (err, res) => {
            if (err) return err
            return res
        })
        req.decoded = decoded
        next()
    } catch (e) {
        res.status(401).send({ error: 'Cannot Verify Token' })
    }
}

module.exports = verify