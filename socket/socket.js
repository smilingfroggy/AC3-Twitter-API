const socketController = require("../controllers/socketController");
const { generateMessage } = require("./message");
const socket = require("socket.io");
const onlineUsers = []; // const listeners = socket.listenersAny();
module.exports = (server) => {
  const io = socket(server, {
    cors: {
      origin: "*",
      // origin: ["http://localhost:8080", "https://bagebear.github.io"],
      methods: ["GET", "POST"],
      transports: ["websocket", "polling"],
      // allowedHeaders: ["my-custom-header"],
      credentials: true,
    },
    allowEIO3: true,
    pingInterval: 10000,
    pingTimeout: 5000,
  });
  io.on("connection", (socket) => {
    console.log("== connected! ===");

    socket.on("unReadCount", async (UserId) => {
      // 待確認
      const unReadCount = await socketController.getUnReadCount(UserId);
      socket.emit("unReadCount", unReadCount);
    });

    socket.on("publicEnter", async (id) => {
      console.log("== publicEnter! ===");
      socket.join("PublicRoom");
      // 回覆歷史訊息
      const history = await socketController.getPublicMessages();
      socket.emit("allMessage", history); //加to PublicRoom 自己會收不到訊息

      // 回覆使用者上線狀態
      const user = await socketController.getUser(id);
      user.content = "上線";
      user.type = "notice";

      if (!onlineUsers.filter((_user) => _user.id === user.id).length) {
        // 檢查排除重複加入上線使用者清單
        onlineUsers.push(user);
      }
      io.in("PublicRoom").emit("publicLogin", user, onlineUsers);
      // fetchSockets 功能測試
      const sockets = await io.in("PublicRoom").fetchSockets();
      socket.data.userId = user.id;
      socket.data.userName = user.name;
      console.log(
        "socket.rooms: ",
        socket.rooms,
        "socket.data: ",
        socket.data,
        "socket.handshakes: ",
        socket.handshakes
      ); //{ userId: 21, userName: 'Camille Gibson DVM' } socket.handshakes:  undefined
    });

    // 離線－V1 重新整理才會離線、登出不會離線
    socket.on("publicLeave", async (id) => {
      console.log(`=== Public Leave ===`); //只有在使用者按推文model視窗之後，才會偵測到transport close(disconnect reason)
      const user = await socketController.getUser(id);
      for (let i = 0; i < onlineUsers.length; i++) {
        if (onlineUsers[i].id === id) {
          onlineUsers.splice(i, 1);
        }
      }
      user.content = "下線";
      user.type = "notice";
      const result = user;
      result.onlineUsers = onlineUsers; // 剩餘的線上使用者清單
      console.log("public leave outputs", result);
      socket.to("PublicRoom").emit("publicLogout", user, onlineUsers); // 若to PublicRoom.broadcast- TypeError: Cannot read property 'emit' of undefined
    });

    // 離線－V2 待測試；無user, id資訊，需處理(預先存入socket.data.name?)
    socket.on("disconnect", async (reason) => {
      console.log(`=== Disconnected ===`);
      console.log(
        `Name- ${socket.data.userName} disconnected due to ${reason}`
      ); //OK / undefined ; server namespace disconnect/ transport close
      const sockets = await io.in("PublicRoom").fetchSockets();
      console.log("socket.rooms: ", socket.rooms, "socket.data: ", socket.data);
      socket.disconnect();
      socket.leave("PublicRoom");
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

    //data = { senderId, receiverId }
    socket.on("privateEnter", async (data) => {
      console.log(`got privateEnter data ${data}`);
      // 不管從userInfo進入或是privateChat，都會載入自己的所有roomId和聊天歷史並加入room
      socket.join("User" + data.senderId); //避免與roomId 重複

      if (data.receiverId) {
        //從userInfo 進入
        const roomId = await socketController.getRoomId(data);
        socket.join(roomId); //TODO: receiver也要加入roomId(receiver上線時就會加入所有所屬roomId)
        const receiver = await socketController.getUser(data.receiverId);
        const receiverRespond = { ...receiver, roomId };
        socket.emit("privateReceiver", receiverRespond);

        // V1 - 僅取得單一roomId的所有歷史訊息；待確認可否 沒有history就不emit
        const history = await socketController.getRoomPrivateMessages(roomId);
        const results = { roomId: roomId, history: history };
        socket.emit("roomPrivateHistory", results);
      }

      // 加入所有所屬roomId
      const allRoomId = await socketController.getAllUserRoomId(data.senderId);
      console.log("allRoomId", allRoomId);
      const allRoomIdWithReceiver = await Promise.all(
        allRoomId.map(async (_room) => {
          if (!_room.UserId || !_room.UserId2) {
            console.log('return')
            return;
          }
          else if(_room.UserId === data.senderId) {
            console.log('bequal')
            let receiver = await socketController.getUser(_room.UserId2);
            console.log('equal',receiver)
            return { ..._room, receiver };
          }
          console.log('!bequal')
          let receiver = await socketController.getUser(_room.UserId);
          console.log('!equal',receiver)
          return { ..._room, receiver };
        })
      );
      allRoomId.forEach((_room) => {
        socket.join(_room.id);
      });
      console.log("allRoomIdWithReceiver", allRoomIdWithReceiver);
      const sockets = await io.in("User" + data.senderId).fetchSockets();
      console.log("joined socket.rooms: ", socket.rooms);

      //  V3 - 取得使用者加入的所有歷史訊息----暫時不用
      const allPrivateHistory = await Promise.all(
        allRoomIdWithReceiver.map(async (_room) => {
          const history = await socketController.getRoomPrivateMessages(
            _room.id
          );
          return { ..._room, history };
        })
      );

      socket.emit("privateHistory", allPrivateHistory);

      // V2 - 取得使用者加入的每個Room的最新歷史訊息
      const latestPrivateHistory =
        await socketController.getLatestPrivateMessages(data.senderId);
      console.log("latest", latestPrivateHistory);
      socket.emit("latestPrivateHistory", latestPrivateHistory);
    });

    socket.on("getRoomHistory", async (data) => {
      // 使用者點選私人訊息列表，需要知道登入使用者 data = { currentUserId, roomId }
      // V1 - 僅取得單一roomId的所有歷史訊息
      // const roomId = await socketController.getRoomId(data)  // 如果前端直接提供roomId

      // socket.join(roomId);  //舊房間在privateEnter時就都加入了；如果是新房間不會透過privateRoomEnter進入
      // TODO: receiver如果在線上也要加入roomId(如果對方原本離線，上線時就會加入所有所屬roomId)

      const history = await socketController.getRoomPrivateMessages(
        data.roomId
      );
      const results = { roomId: data.roomId, history };
      socket.emit("roomPrivateHistory", results);

      // 修改此roomId之所有訊息為已讀 + 總數
      await socketController.readPrivateMessages(
        data.currentUserId,
        data.roomId
      );
      const unReadCount = await socketController.getUnReadCount(
        data.currentUserId
      );
      socket.emit("unReadCount", unReadCount);
    });

    //data= userId1, userId2, content
    socket.on("privateMessage", async (data) => {
      const roomId = await socketController.getRoomId(data);
      const sender = await socketController.getUser(data.senderId); //data 資料格式？假設{ senderId: NUMBER, receiverId: NUMBER, content: STRING}
      const receiver = await socketController.getUser(data.receiverId);
      const newMessage = await socketController.savePrivateMessages(
        data,
        roomId
      );
      // socket.to(roomId).emit("privateMessage", newMessage, roomId, sender, receiver);   //TODO 整理資料
      console.log("sender", sender);
      console.log(newMessage);
      // io.to;
      io.to("User" + data.senderID)
        .to("User" + data.receiverId)
        .emit("privateMessage", newMessage);
      // io.in(roomId).emit("privateMessage", newMessage);
      // socket.to(roomId).emit("privateMessage", newMessage);

      // receiver 若在線上，但不在當下聊天室內，需要更新unReadCount
      const unReadCount = await socketController.getUnReadCount(
        data.receiverId
      );
      io.to("User" + data.receiverId).emit("unReadCount", unReadCount);
    });

    socket.on("sendMessage", async (data) => {
      const newMessage = await socketController.savePublicMessages(data);
      socket.emit("newMessage", newMessage);
      socket.broadcast.emit("newMessage", newMessage);
    });
  });
};
