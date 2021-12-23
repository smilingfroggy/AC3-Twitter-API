const socketController = require('../controllers/socketController')
const { generateMessage } = require('./message')
const socket = require("socket.io");
const onlineUsers = []    // const listeners = socket.listenersAny();
module.exports = (server) => {

  const io = socket(server, {
    cors: {
      // origin: '*',
      origin: ["http://localhost:8080", "https://bagebear.github.io"],
      methods: ["GET", "POST"],
      // transports:['websocket','polling'],
      // allowedHeaders: ["my-custom-header"],
      credentials: true,
    },
    allowEIO3: true,
    pingInterval: 10000,
    pingTimeout: 5000,
  });
  io.on('connection', (socket) => {
    console.log('== connected! ===')


    socket.on("publicEnter", async (id) => {
      socket.join('PublicRoom');
      // 回覆歷史訊息
      const history = await socketController.getPublicMessages()
      socket.emit('allMessage', history)  //加to PublicRoom 自己會收不到訊息

      // 回覆使用者上線狀態
      const user = await socketController.getUser(id)
      user.content = "上線"
      user.type = "notice"

      if (!onlineUsers.filter(_user => _user.id === user.id).length) {   // 檢查排除重複加入上線使用者清單
        onlineUsers.push(user)
        console.log("onlineUsers: ", onlineUsers)
        socket.to('PublicRoom').emit('publicLogin', user, onlineUsers)
      }
      socket.emit('publicLogin', user, onlineUsers) //OK {...}, [{..},{..}] 加to PublicRoom會收不到；放在if之外，自己在沒有disconnected情況下回到聊天室時，才會有onlineUsers列表

      // fetchSockets 功能測試
      const sockets = await io.in("PublicRoom").fetchSockets();
      socket.data.userId = user.id
      socket.data.userName = user.name
      console.log("socket.rooms: ", socket.rooms, "socket.data: ", socket.data, "socket.handshakes: ", socket.handshakes);  //{ userId: 21, userName: 'Camille Gibson DVM' } socket.handshakes:  undefined
    });

    // 離線－V1 重新整理才會離線、登出不會離線
    socket.on("publicLeave", async (id) => {
      console.log(`=== Public Leave ===`) //只有在使用者按推文model視窗之後，才會偵測到transport close(disconnect reason)
      const user = await socketController.getUser(id)
      for (let i = 0; i < onlineUsers.length; i++) {
        if (onlineUsers[i].id === id) {
          onlineUsers.splice(i, 1)
        }
      }
      user.content = "下線"
      user.type = "notice"
      const result = user
      result.onlineUsers = onlineUsers    // 剩餘的線上使用者清單
      console.log("public leave outputs", result)
      socket.to('PublicRoom').emit('publicLogout', user, onlineUsers)  // 若to PublicRoom.broadcast- TypeError: Cannot read property 'emit' of undefined
    });

    // 離線－V2 待測試；無user, id資訊，需處理(預先存入socket.data.name?)
    socket.on("disconnect", async (reason) => {
      console.log(`=== Disconnected ===`)
      console.log(`Name- ${socket.data.userName} disconnected due to ${reason}`) //OK / undefined ; server namespace disconnect/ transport close
      const sockets = await io.in("PublicRoom").fetchSockets();
      console.log("socket.rooms: ", socket.rooms, "socket.data: ", socket.data,)
      socket.disconnect();
      socket.leave('PublicRoom')
      //   for (const room of socket.rooms) {
      //     console.log('socket.rooms', room)
      //     if (room == "PublicRoom") {
      //       socket.to("PublicRoom").emit("publicLogout", `socket.id: ${socket.id} to PublicRoom`);
      //     } else {
      //       console.error(`=== disconnected from room ${room}! ===`)
      //       socket.to(room).emit("publicLogout", `socket.id: ${socket.id}`);
      //     }
      //   }
      //   socket.broadcast.emit('publicLogout', "onlineUsers to provide")
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
      const newMessage = await socketController.savePrivateMessages(data, roomId)
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