const mongoose = require('mongoose')

const RoomSchema = mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        unique: true,
    },
    messages: [{
        name: {
            type: String,
            required: true
        },
        messages: [{
            message: {
                type: String,
                required: true
            },
            forMe:{
                type:Boolean,
                required:true,
                default:false
            },
            forEveryoneElse:{
                type:Boolean,
                required:true,
                default:false
            },
            timestamp: {
                type: Date,
                required: true,
                default: Date.now()
            }
        }]
    }]
}, {
    timestamps: true
})

const RoomModel = mongoose.model('Room', RoomSchema)

module.exports = RoomModel
