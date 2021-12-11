const socketController = require('../controllers/socketController')
const { generateMessage } = require('./message')
const socket = require("socket.io");
const listeners = socket.listenersAny();
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


    socket.on("publicEnter", async (id) => {
      const history = await socketController.getPublicMessages()
      socket.emit('allMessage', history)
      const user = await socketController.getUser(id)
      user.content = "上線"
      user.type = "notice"
      socket.emit('publicLogin', user)
    });


    socket.on("publicLeave", async (id) => {
      const user = await socketController.getUser(id)
      socket.emit('publicLogout', user)
    });

    //data= userId1, userId2
    socket.on("privateEnter", async (data) => {
      const roomId = await socketController.getRoomId(data)
      const user = await socketController.getUser(id)
      socket.join(`${roomId}`);
      socket.to(`${roomId}`).emit('join_privateroom', roomId, user, history);
    });

    /* socket.on("privateLeave", async (data) => {
       const roomId = await socketController.getRoomId(data)
       const user = await socketController.getUser(id)
       socket.leave(`${roomId}`);
       socket.to(`${roomId}`).emit('leave_privateroom', { join_room: `${user.name}下線` });
     });*/

    //data= userId1, userId2, content
    socket.on("privateMessage", (data) => {
      const roomId = await socketController.getRoomId(data)
      const user = await socketController.getUser(id)
      const newMessage = await socketController.savePrivateMessages(data)
      socket.to(`${roomId}`).emit("privateMessage", newMessage, roomId, user);
    });



    socket.on("sendMessage", async (data) => {
      const newMessage = await socketController.savePublicMessages(data)
      socket.emit('newMessage', newMessage)
    });

  })
}