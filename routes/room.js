const express     = require("express");
const router      = express.Router();
const Room = require("../models/Room");
const User = require("../models/User");
const {authenticateUser} = require('../middlewares');

router.get('/', authenticateUser, (req, res) => {
    const {roomId, userId} = req.cookies
    Room.findById(roomId, (err, roomData) => {
        if(err) return res.send("Internal Server Error")
        if(!roomData) return res.send("Room is no longer available")

        User.find({roomId}, (err, participants) => {
            let self
            participants.forEach(participant => {
                if(participant._id == userId) {self = participant; return;}
            })
            console.log(self)

            return res.render('room', {participants, roomData, self, title: "Assassination Room"})
        })
    })
})

module.exports = router