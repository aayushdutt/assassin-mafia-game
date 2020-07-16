const express     = require("express");
const router      = express.Router();
const {authenticateAdmin} = require('../middlewares');
const Room = require("../models/Room");
const User = require("../models/User");

router.get('/', authenticateAdmin, (req, res) => {
    const {roomId} = req.cookies
    
    User.find({roomId: roomId}, (err, participants) => {
        if(err) return res.send('Internal Server Error')
        Room.findById(roomId, (err, roomData) => {
            if(err) return res.send('Internal Server Error')
            return res.render('roomAdmin', {participants, roomData, title: "Admin Room"})
        })
    })
})

router.get('/stopAcceptingParticipants', authenticateAdmin, (req, res) => {
    const {roomId} = req.cookies
    Room.findByIdAndUpdate(roomId, {acceptingParticipants: false}, (err, updatedRoom) => {
        if(err) return res.send("Couldn't stop accepting participants, internal server error")
        res.redirect('/roomAdmin')
    })
})

module.exports = router