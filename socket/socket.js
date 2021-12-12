const socketController = require('../controllers/socketController')
const { generateMessage } = require('./message')
const socket = require("socket.io");
const onlineUsers = []    // const listeners = socket.listenersAny();
module.exports = (server) => {

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
      onlineUsers.push(user)
      user.content = "上線"
      user.type = "notice"
      socket.emit('publicLogin', user, onlineUsers)
      socket.broadcast.emit('publicLogin', user, onlineUsers)
    });


    socket.on("publicLeave", async (id) => {
      const user = await socketController.getUser(id)
      for (let i = 0; i < onlineUsers.length; i ++) {
        if (onlineUsers[i].id === id) {
          onlineUsers.splice(i, 1)
        }
      }
      socket.broadcast.emit('publicLogout', user, onlineUsers)
    });

    //data= userId1, userId2
    socket.on("privateEnter", async (data) => {
      const roomId = await socketController.getRoomId(data)
      const user1 = await socketController.getUser(data[0])   //data 資料格式？假設 [userId1, userId2]
      const user2 = await socketController.getUser(data[1])
      const history = await socketController.getPrivateMessages(roomId)
      socket.join(roomId);
      let results = {}
      results.roomId = roomId
      results.user1 = user1
      results.user2 = user2
      results.history = history
      // socket.to(`${roomId}`).emit('join_privateroom', roomId, user1, user2, history);
      socket.to(roomId).emit('privateLogin', results);
    });

    /* socket.on("privateLeave", async (data) => {
       const roomId = await socketController.getRoomId(data)
       const user = await socketController.getUser(id)
       socket.leave(`${roomId}`);
       socket.to(`${roomId}`).emit('leave_privateroom', { join_room: `${user.name}下線` });
     });*/

    //data= userId1, userId2, content
    socket.on("privateMessage", async (data) => {
      const roomId = await socketController.getRoomId(data)
      const sender = await socketController.getUser(data.senderId)   //data 資料格式？假設{ senderId: NUMBER, receiverId: NUMBER, content: STRING}
      const receiver = await socketController.getUser(data.receiverId)
      const newMessage = await socketController.savePrivateMessages(roomId)
      // socket.to(roomId).emit("privateMessage", newMessage, roomId, sender, receiver);   //TODO 整理資料
      
      socket.to(roomId).emit("privateMessage", newMessage);
    });



    socket.on("sendMessage", async (data) => {
      const newMessage = await socketController.savePublicMessages(data)
      socket.emit('newMessage', newMessage)
      socket.broadcast.emit('newMessage', newMessage)
    });

  })
}