const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const UserRoutes = require('./routes/user-routes')
const RoomRoutes = require('./routes/room-routes')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

require('./routes/room-io')(io)

const port = process.env.PORT
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.json())
app.use(UserRoutes)
app.use(RoomRoutes)
app.use(express.static(publicDirectoryPath))

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})
