const Room = require('./models/Room')
const User = require('./models/User')

const authenticateAdmin = (req, res, next) => {
    const {roomId, roomKey} = req.cookies
    if(!roomId || !roomKey) return res.send("try creating a new room...")
    
    Room.findById(roomId, (err, foundRoom) => {
        if(err) return res.send('Interal Server Error')
        if(!foundRoom) return res.redirect('/')
        if(roomKey != foundRoom.roomKey) return res.redirect('/')
        next()
    })
}

const authenticateUser = (req, res, next) => {
    const {roomId, userId, username, userSecret} = req.cookies
    if(!roomId || !userId || !username || !userSecret) return res.send("please join again...")

    User.findById(userId, (err, foundUser) => {
        if (err) return res.send('Internal Server Error')
        if(!foundUser || foundUser.roomId != roomId || foundUser.userSecret !== userSecret ) 
            return res.send('Please rejoin the room')
        next()
    })
}

const roomIsPlaying = (req, res, next) => {
    const {roomId} = req.cookies
    Room.findById(roomId, (err, foundRoom) => {
        if(foundRoom.isPlaying) {
            return next()
        }
    })
}

module.exports = {authenticateAdmin, authenticateUser, roomIsPlaying}