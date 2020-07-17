 
var mongoose = require("mongoose")

var roomSchema = new mongoose.Schema({
    roomCode: Number,
    roomKey: Number,
    roomStatus: String,
    acceptingParticipants: { type: Boolean, default: true },
    rolesAssigned: { type: Boolean, default: false },
    isPlaying: { type: Boolean, default: false },
    status: [String],
    createdAt: {
        type: Date,
        default: Date.now
    }
})

roomSchema.index( { roomCode: 1 }, { unique: true } )
roomSchema.index( { createdAt: 1 }, { expireAfterSeconds: 9000 } )
module.exports = mongoose.model("Room", roomSchema)