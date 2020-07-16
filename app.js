const express = require('express')
const app = express()
const bodyParser = require('body-parser');

mongoose.connect(keys.mongoUrl, {useNewUrlParser: true,  useUnifiedTopology: true}, function() {
    console.log("MongoDB Connected")
});

app.set("view engine", "ejs")
app.use(express.static(__dirname + "/public"))
app.use(bodyParser.urlencoded({extended: true})) 


const listenPort = process.env.PORT || 8080 
app.listen(listenPort, () => {
    console.log(`Server running on http://localhost:${listenPort}`)
})