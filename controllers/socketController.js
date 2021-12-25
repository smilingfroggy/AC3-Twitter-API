const db = require("../models");
const { Op } = require("sequelize");
const User = db.User;
const PublicMessage = db.PublicMessage;
const PrivateMessage = db.PrivateMessage;
const Room = db.Room;

const socketController = {
  getUser: (UserId) => {
    return User.findByPk(UserId, {
      attributes: ["id", "name", "avatar", "account"],
    }).then((user) => {
      user = user.toJSON();
      // user.content = "上線"   // 由socket.js處理
      // user.type = "notice"    //已確認不寫入資料庫/歷史訊息不顯示notice(上下線訊息)
      // console.log(user)
      return user;
    });
  },
  savePublicMessages: (data) => {
    const { content, id } = data;
    return Promise.all([
      PublicMessage.create({
        content,
        UserId: id,
        type: "message", // type
      }),
      User.findByPk(id, {
        attributes: ["id", "name", "avatar", "account"],
      }),
    ]).then(([newMessages, user]) => {
      user = user.toJSON();
      return [newMessages, user];
    });
  },
  getPublicMessages: () => {
    return PublicMessage.findAll({
      raw: true,
      nest: true,
      include: { model: User, attributes: ["id", "name", "avatar", "account"] },
      attributes: ["id", "content", "createdAt"],
      order: [["createdAt", "ASC"]],
    }).then((messages) => {
      return messages;
    });
  },
  getRoomId: (data) => {
    //建立新 private room
    // 判斷大小，UserId-小 UserId2-大
    let [id, id2] = [data.senderId, data.receiverId];
    let UserId, UserId2;
    if (id > id2) {
      [UserId, UserId2] = [id2, id];
    } else {
      [UserId, UserId2] = [id, id2];
    }
    return Room.findOrCreate({
      //+ include user
      where: { UserId, UserId2 },
    }).then((room) => {
      return room[0].id;
    });
  },
  getAllUserRoomId: (UserId) => {
    return Room.findAll({
      attributes: ["id"],
      where: { [Op.or]: [{ UserId }, { UserId2: UserId }] },
    }).then((room) => {
      return room.map((_data) => {
        return _data.dataValues.id;
      });
    });
  },
  // getPrivateUserHistories: (UserId) => {},
  savePrivateMessages: (data, RoomId) => {
    const { content, receiverId, senderId } = data;
    return Promise.all([
      PrivateMessage.create({
        content,
        receiverId,
        senderId,
        // name,
        // avatar,
        // account,
        RoomId,
      }),
      User.findByPk(senderId, {
        attributes: ["id", "name", "avatar", "account"],
      }),
    ]).then(([privateMessages, user]) => {
      privateMessages = privateMessages.toJSON();
      user = user.toJSON();
      const newMessages = { room: RoomId }; // 外面再包一個roomID---待確認是否還需要外面包room
      newMessages.newMessages = privateMessages;
      newMessages.user = user;
      return newMessages;
    });
  },
  getPrivateMessages: (RoomId) => {
    //所有歷史訊息
    return Promise.all([
      PrivateMessage.findAll({
        where: { RoomId },
        order: [["createdAt", "DESC"]], // 待確認排序
      }),
      // Room.findByPk(RoomId).then(room => {   //待確認 訊息物件裡，是否包含2位user使用者資料
      //   User.findByPk(room.UserId).then(user => {
      //     User.findByPk(room.UserId2).then()
      //   })
      // })
    ]).then(([privateMessages]) => {
      //, user, user
      return privateMessages;
    });
  },
  // getPrivateMessages1: (UserId) => {   // 前端：跟使用者有關的所有歷史訊息(而不是roomID)
  //   return PrivateMessage.findAll({
  //     raw: true,
  //     nest: true,
  //     where: { $or: {
  //       senderId: UserId,
  //       receiverId: UserId
  //     } },    // 不用RoomId找
  //     include: { model: User, attributes: ['id', 'name', 'avatar', 'account'] },
  //     attributes: ['id', 'content', 'createdAt'],
  //     order: [['createdAt', 'ASC']]
  //   })
  //     .then(messages => {     //

  //     })
  // },
};

module.exports = socketController;
