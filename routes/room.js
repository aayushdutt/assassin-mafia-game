const express     = require("express");
const router      = express.Router();
const Room = require("../models/Room");
const User = require("../models/User");
const {authenticateUser, roomIsPlaying} = require('../middlewares');

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
    
            return res.render('room', {participants, roomData, self, title: "Assassination Room"})
        })
    })
})

router.get('/vote/:participantId', authenticateUser, roomIsPlaying, (req, res) => {
    const {roomId, userId} = req.cookies
    User.findById(userId, (err, foundUser) => {
        if(!foundUser || err) return res.send("Couldn't vote, please try again")

        if(foundUser.isKilled || !foundUser.canPlay || foundUser.role !== 'villager') {
            return res.send("Vote was not allowed")
        }

        User.findByIdAndUpdate(req.params.participantId, { $inc: {'votesRecieved': 1 } }, (err, updatedParticipant) => {
            if(err) return res.send("Couldn't vote, internal server error")
            User.findByIdAndUpdate(userId, {canPlay: false}, (err) => {
                if(err) return res.send("Couldn't vote, internal server error")
                return res.redirect('/room')
            })
        })
    })
})

router.get('/reveal/:participantId', authenticateUser, roomIsPlaying, (req, res) => {
    const {roomId, userId} = req.cookies
    User.findById(userId, (err, foundUser) => {
        if(!foundUser || err) return res.send("Couldn't assassinate, please try again")

        if(foundUser.isKilled || !foundUser.canPlay || foundUser.role !== 'seer') {
            return res.send("Reveal was not allowed")
        }

        User.findByIdAndUpdate(req.params.participantId, { isRevealed: true }, (err, updatedParticipant) => {
            if(err) return res.send("Couldn't reveal, internal server error")
            User.findByIdAndUpdate(userId, {canPlay: false}, (err) => {
                if(err) return res.send("Couldn't reveal, internal server error")
                return res.redirect('/room')
            })
        })
    })
})

router.get('/assassinate/:participantId', authenticateUser, roomIsPlaying, (req, res) => {
    const {roomId, userId} = req.cookies
    User.findById(userId, (err, foundUser) => {
        if(!foundUser || err) return res.send("Couldn't assassinate, please try again")

        if(foundUser.isKilled || !foundUser.canPlay || foundUser.role !== 'assassin') {
            return res.send("Illegal Assassination")
        }

        User.findByIdAndUpdate(req.params.participantId, { isAssassinated: true }, (err, updatedParticipant) => {
            if(err) return res.send("Couldn't assassinate, internal server error")
            User.findByIdAndUpdate(userId, {canPlay: false}, (err) => {
                if(err) return res.send("Couldn't assassinate, internal server error")
                return res.redirect('/room')
            })
        })
    })
})

module.exports = router