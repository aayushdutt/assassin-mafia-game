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
            Room.findByIdAndUpdate(roomId, {rolesAssigned: true, status: ["Roles are assigned"]}, (err, updatedRoom) => {
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
            Room.updateOne({ _id: roomId }, { isPlaying: true, status: [] }, (err, updatedRoom) => {
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
        let maxVoted
        let maxVotes = 0

        participants.forEach((participant, idx) => {
            if(!participant.isKilled) {
                if(participant.isAssassinated) {
                    participant.isKilled = true
                    participant.canPlay = false
                    assassinated.push(participant)
                }
                if(participant.votesRecieved > maxVotes) {
                    maxVoted = participant
                    maxVotes = participant.votesRecieved
                }
            }
        })

        let status = []
        assassinated.forEach(assassinatedPlayer => {
            status.push(`${assassinatedPlayer.username} was assassinated`)
        })

        if(maxVotes > 0 && maxVoted) {
            if(!maxVoted.isKilled) {
                //if not already assassinated
                status.push(`${maxVoted.username} was killed by villagers`)
                maxVoted.isKilled = true
                maxVoted.canPlay = false
                assassinated.push(maxVoted)
            }
            else {
                status.push(`${maxVoted.username} was killed by villagers as well`)
            }
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


router.get('/resetRoom', authenticateAdmin, (req, res) => {
    const { roomId } = req.cookies
    Room.findByIdAndUpdate(roomId, {
        isPlaying: false,
        rolesAssigned: false,
        status: ["Room resetted"]
    },  (err, updatedRoom) => {
        if(err) return res.send("Couldn't reset room")
        User.updateMany({roomId}, {
            role: "",
            votesRecieved: 0,
            canPlay: false,
            isKilled: false,
            isRevealed: false,
            isAssassinated: false
        }, (err, participants) => {
            if(err) {
                console.log(err)
                return res.send("Couldn't reset room")
            }
            return res.redirect('/roomAdmin')
        }) 
    })
})

module.exports = router