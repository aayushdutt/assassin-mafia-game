 
var mongoose = require("mongoose")

var roomSchema = new mongoose.Schema({
    roomCode: Number,
    roomKey: Number,
    roomStatus: String,
    acceptingParticipants: { type: Boolean, default: true },
    isPlaying: { type: Boolean, default: false },
    rolesAssigned: { type: Boolean, default: false }
})

module.exports = mongoose.model("Room", roomSchema)