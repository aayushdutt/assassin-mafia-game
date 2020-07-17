var mongoose = require("mongoose")

var userSchema = new mongoose.Schema({
    username: String,
    userSecret: String,
    role: String,
    roomCode: Number,
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room"
    },
    votesRecieved: { type: Number, default: 0 },
    canPlay: { type: Boolean, default: false },
    isKilled: { type: Boolean, default: false },
    isRevealed: { type: Boolean, default: false },
    isAssassinated: { type: Boolean, default: false },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

userSchema.index( { roomCode: 1, username: 1 }, { unique: true } )
userSchema.index( { createdAt: 1 }, { expireAfterSeconds: 9000 } )
module.exports = mongoose.model("User", userSchema)