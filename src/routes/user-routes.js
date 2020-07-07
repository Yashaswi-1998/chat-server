const express = require('express')
const User = require('../models/user-model')
const mongoose = require('../db/mongoose')
const sendmail = require('../email/accounts')
const auth = require('../middleware/auth')
const verify = require('../middleware/verify')
const jwt = require('jsonwebtoken')
const generate_password = require('generate-password')

const router = express.Router()

router.post('/signUpUser', async (req, res) => {
    try {
        if (mongoose.connection.readyState == 1) {
            keys = Object.keys(req.body)
            const mandatories = ['name', 'password', 'email']
            const isValidOp = mandatories.every((mandatory) => keys.includes(mandatory))
            if (!isValidOp) return res.status(401).send({ error: 'Fill the mandatory field' })

            User.findOne({ email: req.body.email }, async (err, user) => {
                if (user) return res.status(409).send({ error: 'Email already associated with another account.' })
                user = User(req.body)
                var token = jwt.sign({ details: user }, process.env.JWT_SECRET)
                sendmail.sendMailVerifyAccount(req.body.email, req.headers.host, 'verifyUser', token)
                return res.status(202).send({ msg: 'Verification mail was sent to email' })
            })
        } else {
            var e = Error('DB Not Connected')
            e.name = 'ServerError'
            throw e
        }
    } catch (e) {
        console.log({ error: e.name })
        console.log({ error: e.message })
        if (e.name === 'ValidationError') res.status(422).send({ error: e.message })
        else if (e.name === 'ServerError') res.status(500).send({ error: e.message })
        else res.status(500).send({ error: e.message })
    }
})

router.get('/verifyUser/:token', verify, async (req, res) => {
    const mainuser = User(req.decoded.details)
    await User.findOne({ _id: mainuser._id }, async (err, user) => {
        if (user) {
            if (user.isVerified) return res.status(410).send({ error: 'This user has already been verified' })
        } else {
            mainuser.isVerified = true;
            await mainuser.save((err) => {
                if (err) { return res.status(500).send({ error: err.message }) }
                res.status(201).send({ msg: 'The account has been verified. Please log in.' })
            })
        }
    })
})

router.post('/logInUser', async (req, res) => {
    try {
        if (mongoose.connection.readyState == 1) {
            const user = await User.findByCredentials(req.body.email, req.body.password)
            const token = await user.generateToken()
            res.status(200).send({ msg: token })
        } else {
            var e = Error('DB Not Connected')
            e.name = 'ServerError'
            throw e
        }
    } catch (e) {
        console.log({ error: e.name })
        console.log({ error: e.message })
        if (e.name === 'ValidationError') res.status(422).send({ error: e.message })
        else if (e.name === 'ServerError') res.status(500).send({ error: e.message })
        else res.status(500).send({ error: e.message })
    }
})

router.post('/resendPassword', async (req, res) => {
    try {
        if (mongoose.connection.readyState == 1) {
            User.findOne({ email: req.query.email }, async (err, user) => {
                console.log(req.query.email)
                if (err || !user) return res.status(409).send({
                    error: 'Email Not Associated with any Account'
                })
                const password = generate_password.generate({
                    length: 8,
                    numbers: true,
                    symbols: true,
                    lowercase: true,
                    uppercase: true,
                    excludeSimilarCharacters: true,
                    strict: true
                })
                user.password = password
                await user.save()
                sendmail.sendMailResendPassword(req.query.email, password)
                return res.status(202).send({
                    msg: 'New Password was Sent to Email'
                })
            })
        } else {
            var e = Error('DB Not Connected')
            e.name = 'ServerError'
            throw e
        }
    } catch (e) {
        if (e.name === 'ValidationError') res.status(422).send({
            error: e.message
        })
        else res.status(500).send({
            error: e.message
        })
    }
})

router.post('/logOutUser', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()
        res.status(200).send({ msg: 'The user has been logged out from current device' })
    }
    catch (e) {
        res.status(500).send({ error: e.message })
    }
})

router.post('/logOutUserEverywhere', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.status(200).send({ error: 'The user has been logged out from every device' })
    }
    catch (e) {
        res.status(500).send({ error: e.message })
    }
})

router.get('/getUser', auth, async (req, res) => {
    res.status(200).send(req.user.toRemove())
})

router.patch('/updateUserEmail', auth, async (req, res) => {
    const newEmail = req.body.email
    try {
        var token = jwt.sign({ oldemail: req.user.email, newemail: newEmail }, process.env.JWT_SECRET)
        sendmail.sendMailChangeEmail(req.body.email, req.headers.host, 'verifyEmailUpdate', token)
        return res.status(202).send({ msg: 'Verification mail was sent to email' })
    } catch (e) {
        console.log(e)
        res.status(500).send({ error: 'Server Error!!!' })
    }
})

router.get('/verifyEmailUpdate/:token', verify, async (req, res) => {
    const newEmail = req.decoded.newemail
    const oldEmail = req.decoded.oldemail
    await User.findOne({ email: oldEmail }, async (err, user) => {
        if (user) {
            user.email = newEmail
            await user.save((err) => {
                if (err) { return res.status(500).send({ error: err.message }) }
                res.status(200).send({ msg: 'The email has updated. Please log in.' })
            })
        } else {
            res.status(404).send({ error: 'No User Exixts' })
        }
    })
})

router.patch('/updateUser', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'password']
    const isValidOp = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOp) return res.status(403).send({ error: 'Invalid Update Data!!!' })

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        if (mongoose.connection.readyState == 1) await req.user.save()
        else throw Error({ error: 'DB Not Connected' })
        res.status(200).send({ msg: req.user })
    } catch (e) {
        console.log(e)
        res.status(500).send({ error: 'Server Error!!!' })
    }
})

router.delete('/removeUser', auth, async (req, res) => {
    try {
        await req.user.remove()
        res.status(200).send({ msg: 'Succesfully removed' })
    }
    catch (e) {
        res.status(500).send({ error: e.message })
    }
})

module.exports = router