const express = require('express')
const Room = require('../models/room-model')
const User=require('../models/user-model')
const auth = require('../middleware/auth')
const mongoose = require('../db/mongoose')
const { type } = require('os')
const { isBoolean } = require('util')

const router = express.Router()

router.post('/addRoom', auth, async (req, res) => {
    try {
        if (mongoose.connection.readyState == 1) {
            Room.findOne({ name: req.body.name }, async (err, room) => {
                if (room) {
                    const name = room.messages.find((item) => {
                        return item.name === req.user.email
                    })
                    if (name) return res.status(409).send({ error: 'User Already Exists in Room' })
                    else {
                        room.messages = room.messages.concat({
                            name: req.user.email,
                            messages: []
                        })
                        await room.save()
                        return res.status(201).send({ msg: 'User Added in Room' })
                    }
                } else {
                    const roomDetails = {
                        name: req.body.name,
                        messages: [{
                            name: req.user.email,
                            messages: []
                        }]
                    }
                    room = Room(roomDetails)
                }
                room.save()
                roomName=req.body.name
                
                req.user.rooms.push({room:roomName})
                await req.user.save()

                return res.status(201).send({ msg: 'Room Created' })
            })
        } else {
            var e = Error('DB Not Connected')
            e.name = 'ServerError'
            throw e
        }
    } catch (e) {
        if (e.name === 'ValidationError') res.status(400).send({ error: e.message })
        else res.status(500).send({ error: e.message })
    }
})

// router.post('/addRoomMessage', auth, async (req, res) => {
//     try {
//         if (mongoose.connection.readyState == 1) {
//             Room.findOne({ name: req.body.name }, async (err, room) => {
//                 if (room) {
//                     const message = req.body.message
//                     room.messages.find((item) => {
//                         return item.name === req.user.email
//                     }).messages.push({ message })
//                     console.log(room.messages.find((item) => {
//                         return item.name === req.user.email
//                     }).messages)
//                     await room.save()

//                     return res.status(200).send({ msg: "Message Added" })
//                 }
//                 else {
//                     res.status(404).send({ msg: "Room not found" })
//                 }

//             })
//         } else {
//             var e = Error('DB Not Connected')
//             e.name = 'ServerError'
//             throw e
//         }
//     } catch (e) {
//         if (e.name === 'ValidationError') res.status(400).send({ error: e.message })
//         else res.status(500).send({ error: e.message })
//     }
// })

router.get('/getRoom', async (req, res) => {
    try {
        if (mongoose.connection.readyState == 1) {
            Room.findOne({ name: req.body.name }, async (err, room) => {
                if (room) return res.status(200).send({ msg: room })
                return res.status(404).send({ error: 'Room Not Found' })
            })
        } else {
            var e = Error('DB Not Connected')
            e.name = 'ServerError'
            throw e
        }
    } catch (e) {
        if (e.name === 'ValidationError') res.status(400).send({ error: e.message })
        else res.status(500).send({ error: e.message })
    }
})

router.delete('/removeRoom',auth, async (req, res) => {
    try {
        if (mongoose.connection.readyState == 1) {
            Room.findOne({ name: req.body.name }, async (err, room) => {
                if (room) {
                    await room.remove()
                    const ind=req.user.rooms.indexOf(req.body.name)
                    req.user.rooms.splice(ind,1)
                    req.user.save()
                    return res.status(200).send({ msg: 'Room Removed' })
                }
                return res.status(404).send({ error: 'Room Not Found' })
            })
        } else {
            var e = Error('DB Not Connected')
            e.name = 'ServerError'
            throw e
        }
    } catch (e) {
        if (e.name === 'ValidationError') res.status(400).send({ error: e.message })
        else res.status(500).send({ error: e.message })
    }
})

router.delete('/removeRoomMessage',auth, async (req, res) => {
    try {
        if (mongoose.connection.readyState == 1) {
            Room.findOne({ name: req.body.name }, async (err, room) => {
                if (room) {
                    const messages = room.messages.find((item) => {
                        return item.name === req.user.email
                    }).messages
                    
                    const index = messages.findIndex((message)=>{
                         return  message._id==req.body._id
                    })
                    if(index>=0)
                    {
                        
                    forMe=messages[index].forMe
                    forEveryoneElse=messages[index].forEveryoneElse

                    var b1=JSON.parse(req.body.forMe)
                    var b2=JSON.parse(req.body.forEveryoneElse)
                    
                    messages[index].forMe=forMe||b1
                    messages[index].forEveryoneElse=forEveryoneElse||b2
                    
                    if(messages[index].forMe&&messages[index].forEveryoneElse)
                    {
                    messages.splice(index, 1)
                    }
                   
                    await room.save()
                    return res.status(200).send({ msg: 'Message Deleted'})
                }else{
                    res.status(404).send({msg:'Message already deleted'})
                }

                }
                else{
                   res.status(404).send({msg:'Room Not Found'})
                }
               
            })
        } else {
            var e = Error('DB Not Connected')
            e.name = 'ServerError'
            throw e
        }
    } catch (e) {
        if (e.name === 'ValidationError') res.status(400).send({ error: e.message })
        else res.status(500).send({ error: e.message })
    }
})

module.exports = router