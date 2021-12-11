const socketController = require('../controllers/socketController')
const { generateMessage } = require('./message')
const socket = require("socket.io");

module.exports = (server) => {

  /*const io = require('socket.io')(server)
  const chat_Msg = '123'

  io.on('public chat', async (chat_Msg) => {
    console.log('=== receive public chat message ===')
    await socketController.storeMessage(chat_Msg)
    io.emit('notice', '收到聊天室訊息')
    io.emit('public chat', generateMessage('chat_Msg'))
  })*/

  const io = socket(server, {
    cors: {
      origin: "http://localhost:8080",
      methods: ["GET", "POST"],
      // transports:['websocket','polling'],
      credentials: true,
    },
    allowEIO3: true,
  });
  // const io = require('socket.io')(http);
  // const io = require("socket.io")(3000)  //  OK
  io.on("connection", (socket) => {
    // io.on OK
    // either with send()
    console.log("USER CONNECTED");
    socket.send("Hello!");
    // or with emit() and custom event names
    socket.emit("greetings", "Hey!", { ms: "jane" }, Buffer.from([4, 3, 3, 1]));
    // handle the event sent with socket.send()
    socket.on("chatMsg", (data) => {
      console.log(data);
    });
  });



}