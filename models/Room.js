 
var mongoose = require("mongoose")

var roomSchema = new mongoose.Schema({
    roomCode: Number,
    roomKey: Number,
    roomStatus: String,
    acceptingParticipants: { type: Boolean, default: true },
    rolesAssigned: { type: Boolean, default: false },
    isPlaying: { type: Boolean, default: false },
    status: [String]
})

module.exports = mongoose.model("Room", roomSchema)