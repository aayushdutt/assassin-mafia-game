const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const Room = require('./models/Room');
const User = require('./models/User');
const roomRoutes = require('./routes/room');
const roomAdminRoutes = require('./routes/roomAdmin');
const { authenticateAdmin } = require('./middlewares');

mongoose.connect('mongodb://localhost:27017/assassin', { useNewUrlParser: true, useUnifiedTopology: true }, function () {
  console.log("MongoDB Connected")
});

app.set("view engine", "ejs")
app.use(cookieParser());
app.use(express.static(__dirname + "/public"))
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  return res.render('index')
})


app.post('/createRoom', (req, res) => {
  let roomCode = Math.floor(Math.random() * 100000)
  const roomKey = Math.floor(Math.random() * 10000000)

  // Check if room already exists
  Room.findOne({ roomCode }, (err, foundRoom) => {
    console.log(foundRoom)
    if (err || foundRoom) return res.send("Please try again...")

    const newRoom = {
      roomCode,
      participants: [],
      roomKey,
      acceptingParticipants: true,
      isPlaying: false
    }
    // TODO: add option for password protecting
  
    Room.create(newRoom, (err, createdRoom) => {
      if (err) return res.send('An error occurred')
      // TODO: set timeout to delete room after 150 mins
      res.cookie('roomId', createdRoom._id, { expires: new Date(Date.now() + 9000000) });
      res.cookie('roomKey', roomKey, { expires: new Date(Date.now() + 9000000) });
      return res.redirect('/roomAdmin')
    })
  })
})

app.post('/joinRoom', (req, res) => {
  const { roomCode, username } = req.body

  if (!username) return res.send('Bad Username')
  
  Room.findOne({ roomCode }, (err, foundRoom) => {
    if (err) return res.send("Internal Server Error")
    if (!foundRoom || !foundRoom.acceptingParticipants) return res.send("Room not found or is no longer accepting participants")

    User.findOne({ username, roomCode }, (err, foundUser) => {
      if (err) return res.send("Internal Server Error")
      if (foundUser) return res.send("User already exists in this room")

      const newUser = {
        username,
        userSecret: Math.floor(Math.random() * 10000000),
        roomCode,
        roomId: foundRoom._id
      }

      User.create(newUser, (err, createdUser) => {
        if (err) return res.send("Internal Server Error")
        res.cookie('username', username, { expires: new Date(Date.now() + 9000000) });
        res.cookie('userSecret', createdUser.userSecret, { expires: new Date(Date.now() + 9000000) });
        res.cookie('roomId', foundRoom._id, { expires: new Date(Date.now() + 9000000) });
        res.cookie('userId', createdUser._id, { expires: new Date(Date.now() + 9000000) });
        return res.redirect('/room')
      })
    })
  })
})

app.use('/room', roomRoutes)
app.use('/roomAdmin', roomAdminRoutes)

//reset participants
//allow votes
//allow joiners
//vote
//reveal
//kill
//removeUser
const listenPort = process.env.PORT || 8080
app.listen(listenPort, () => {
  console.log(`Server running on http://localhost:${listenPort}`)
})