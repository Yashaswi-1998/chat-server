const Room = require('../models/room-model')
const mongoose = require('../db/mongoose')
const generateMessage = require('../utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('../utils/users')

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New WebSocket connection')

        socket.on('join', (options, callback) => {
            const { error, user } = addUser({ id: socket.id, ...options })
            if (error) return callback(error)
            socket.join(user.room)
            socket.emit('message', generateMessage('Admin', 'Welcome!'))
            socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
            callback()
        })

        socket.on('sendMessage', (message, room, username, callback) => {
            var _id
            try {
                if (mongoose.connection.readyState == 1) {
                    Room.findOne({ name: room }, async (err, room) => {
                        if (room) {
                        name =room.messages.find((item) => {
                                return item.name === username
                            })
                        name.messages.push({ message })
                        const n =name.messages.length
                         _id=name.messages[n-1]._id
                        console.log(name.messages[n-1]._id)
                            await room.save()

                        }
                        else {
                            console.log('Room Not Found')
                        }
                    })
                } else {
                    console.log('DB Not Connected')
                }
            } catch (e) {
                console.log(e)
                callback()
            }
            io.to(room).emit('message', generateMessage(username, message,_id))
            callback()
        })

        socket.on('disconnect', () => {
            const user = removeUser(socket.id)
            if (user) {
                io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
                io.to(user.room).emit('roomData', {
                    room: user.room,
                    users: getUsersInRoom(user.room)
                })
            }
        })
    })
}