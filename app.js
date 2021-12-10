const express = require('express')
const helpers = require('./_helpers');
const routes = require('./routes')
const cors = require('cors')
const app = express()
const port = process.env.PORT || 3000

const http = require('http')
const socket = require('socket.io')
const server = http.createServer(app) // use express to handle http server
const io = socket(server);

// const io = require('socket.io')(http);
// const io = require("socket.io")(3000)  //  OK

io.on("connection", socket => {   // io.on OK
  // either with send()
  socket.send("Hello!");

  // or with emit() and custom event names
  socket.emit("greetings", "Hey!", { "ms": "jane" }, Buffer.from([4, 3, 3, 1]));

  // handle the event sent with socket.send()
  socket.on("chatMSG", (data) => {
    console.log(data);
  })
})




// io.on('connection', (socket) => {
//   socket.on('chatMSG', msg => {
//     io.emit('chatMSG', msg);
//   });
// });

app.use(cors())
if (process.env.NODE_ENV !== "production") {
  require('dotenv').config()
}
const passport = require('./config/passport')


// use helpers.getUser(req) to replace req.user
function authenticated(req, res, next) {
  // passport.authenticate('jwt', { ses...
};

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(passport.initialize())

// app.listen(port, () => console.log(`Example app listening on port ${port}!`))
app.use(routes)


module.exports = app
