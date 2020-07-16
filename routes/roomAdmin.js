const express = require("express");
const router = express.Router();
const { authenticateAdmin } = require('../middlewares');
const Room = require("../models/Room");
const User = require("../models/User");

function randomBetween(a, b) {
    return Math.floor(a + Math.random() * (b - a))
}

router.get('/', authenticateAdmin, (req, res) => {
    const { roomId } = req.cookies

    User.find({ roomId: roomId }, (err, participants) => {
        if (err) return res.send('Internal Server Error')
        Room.findById(roomId, (err, roomData) => {
            if (err) return res.send('Internal Server Error')
            return res.render('roomAdmin', { participants, roomData, title: "Admin Room" })
        })
    })
})

router.get('/closeRoom', authenticateAdmin, (req, res) => {
    const { roomId } = req.cookies
    Room.findByIdAndUpdate(roomId, { acceptingParticipants: false }, (err, updatedRoom) => {
        if (err) return res.send("Couldn't toggle room")
        res.redirect('/roomAdmin')
    })
})

router.get('/openRoom', authenticateAdmin, (req, res) => {
    const { roomId } = req.cookies
    Room.findByIdAndUpdate(roomId, { acceptingParticipants: true }, (err, updatedRoom) => {
        if (err) return res.send("Couldn't toggle room")
        res.redirect('/roomAdmin')
    })
})

router.post('/assignRoles', authenticateAdmin, (req, res) => {
    const { roomId } = req.cookies
    const { seers, assassins } = req.body
    if(!seers || !assassins) return res.send("Seers and Assassins required")

    User.find({ roomId: roomId })
    .then((participants) => {
        console.log(participants)
        if(seers + assassins > participants) {
            return res.send("not enough participants")
        }

        let queue = []
        const len = participants.length
        let remAssassins = parseInt(assassins) , remSeers = parseInt(seers)
        for(let i=0; i<len; i++) {
            let toSwapIndex =  randomBetween(i, len);
            // perform swap
            let temp = participants[i]
            participants[i] = participants[toSwapIndex]
            participants[toSwapIndex] = temp

            // assign role
            if(remAssassins) {
                participants[i].role = 'assassin'    
                queue.push(participants[i].save())
                remAssassins--
            }
            else if(remSeers) {
                participants[i].role = 'seer'    
                queue.push(participants[i].save())
                remSeers--
            }
            else {
                participants[i].role = 'villager'    
                queue.push(participants[i].save())
            }
        }

        Promise.all(queue)
        .then(() => {
            Room.findByIdAndUpdate(roomId, {rolesAssigned: true}, (err, updatedRoom) => {
                return res.redirect('/roomAdmin')
            })
        })
        .catch((err) => {
            return res.send(err)
        })
    })

})

router.get('/startRound', authenticateAdmin, (req, res) => {
    const { roomId } = req.cookies
    Room.findById(roomId, (err, foundRoom) => {
        if (err || !foundRoom || !foundRoom.rolesAssigned)
        return
        
        User.updateMany({ roomId, isKilled: false }, {
            votesRecieved: 0,
            canPlay: true
        }, (err, updatedParticipants) => {
            if (err) return res.send("Couldn't start round")
            Room.updateOne({ _id: roomId }, { isPlaying: true }, (err, updatedRoom) => {
                if (err) return res.send("Couldn't start round")
                return res.redirect('/roomAdmin')
            })
        })
    })
})

router.get('/getResults', authenticateAdmin, (req, res) => {
    const { roomId } = req.cookies
    User.find({roomId}, (err, participants) => {
        let assassinated = []
        let maxVoted = participants[0]
        let maxVotes = participants[0].votesRecieved
        let isDraw = false
        participants.forEach(participant => {
            if(participant.isAssassinated && !participant.isKilled) {
                participant.isKilled = true
                assassinated.push(participant)
            }
            else if(participant.votesRecieved === maxVotes) {
                isDraw = true
            }
            if(participant.votesRecieved > maxVotes) {
                maxVoted = participant
                maxVotes = participant.votesRecieved
                isDraw = false
            }
        })

        let status = []
        assassinated.forEach(assassinatedPlayer => {
            status.push(`${assassinatedPlayer.username} was assassinated`)
        })
        if(isDraw) {
            status.push("Votes resulted in a draw, no one was killed")
        } else {
            maxVoted.isKilled = true
            assassinated.push(maxVoted)
        }

        Promise.all(assassinated.map(player => player.save()))
        .then(() => {
            Room.findByIdAndUpdate(roomId, {isPlaying: false, status}, (err, updatedRoom) => {
                if(err) {
                    console.log(err)
                    return res.send("Couldn't update room")
                }
                return res.redirect('/roomAdmin')
            })
        })
        .catch(err => {
            console.log(err)
            return res.send("Couldn't get results, internal server error")
        })
    })
})


module.exports = router