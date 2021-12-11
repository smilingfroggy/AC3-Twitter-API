const socketController = require('../controllers/socketController')
const { generateMessage } = require('./message')
const socket = require("socket.io");
module.exports = (server) => {

  // let messages = [
  //   { name: "Majer", content: "吃早餐", id: 1, type: "message" },
  //   { name: "Tom", content: "你好", id: 2, type: "message" },
  //   { name: "Marry", content: "SOSOSOSOSODODODODODDODO", id: 3, type: "message" },
  // ];
  const io = socket(server, {
    cors: {
      origin: "http://localhost:8080",
      methods: ["GET", "POST"],
      // transports:['websocket','polling'],
      credentials: true,
    },
    allowEIO3: true,
  });
  io.on('connection', (socket) => {
    console.log('== connected! ===')
    socket.on("login", async (id) => {    //async await待確認
      const user = await socketController.getUser(id)
      socket.emit('Login', user)
    });
  })

}