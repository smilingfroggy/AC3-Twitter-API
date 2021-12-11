const db = require('../models')
const User = db.User
const PublicMessage = db.PublicMessage
const PrivateMessage = db.PrivateMessage
const Room = db.Room

const socketController = {
  getUser: (UserId) => {
    return User.findByPk(UserId, {
      attributes: ['id', 'name', 'avatar', 'account']
    }).then(user => {
      user = user.toJSON()
      // user.content = "上線"   // 由socket.js處理
      // user.type = "notice"    //已確認不寫入資料庫/歷史訊息不顯示notice(上下線訊息)
      // console.log(user)
      return user
    })
  },
  savePublicMessages: (data) => {
    const { content, id } = data
    return Promise.all([
      PublicMessage.create({
        content, UserId: id, type: "message" // type
      }),
      User.findByPk(id, {
        attributes: ['id', 'name', 'avatar', 'account']
      })
    ])
      .then(([newMessages, user]) => {
        user = user.toJSON()
        return ([newMessages, user])
      })
  },
  getPublicMessages: () => {
    return PublicMessage.findAll({
      raw: true,
      nest: true,
      include: { model: User, attributes: ['id', 'name', 'avatar', 'account'] },
      attributes: ['id', 'content', 'createdAt'],
      order: [['createdAt', 'ASC']]
    })
      .then(messages => {
        console.log(messages)
        return messages
      })
  },
  getRoomId: (UserId, UserId2) => {   //建立新 private room
    return Room.findOrCreate({   //+ include user
      UserId, UserId2
    })
      .then(room => { return room.id })
  },
  savePrivateMessages: (data) => {
    const { content, receiverId, senderId, RoomId } = data
    return Promise.all([
      PrivateMessage.create({
        content, receiverId, senderId, RoomId
      }),
      User.findByPk(senderId, {
        attributes: ['id', 'name', 'avatar', 'account']
      })
    ])
      .then(([privateMessages, user]) => {
        user = user.toJSON()
        const newMessages = { room: RoomId }  // 外面再包一個roomID---待確認是否還需要外面包room
        newMessages.room.newMessages = privateMessages
        newMessages.room.user = user
        return (newMessages)
      })
  },
  getPrivateMessages: (RoomId) => {    // Room難以一次做2個 userId關聯取得user資料 
    return Promise.all([
      PrivateMessage.findAll({
        where: { RoomId }   //無法include因privateMSG無關連到user
      }),
      // Room.findByPk(RoomId).then(room => {   //待確認 訊息物件裡，是否包含2位user使用者資料
      //   User.findByPk(room.UserId).then(user => { 
      //     User.findByPk(room.UserId2).then()
      //   })
      // })
    ])
      .then(([privateMessages]) => {    //, user, user
        return privateMessages
      })
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
}

module.exports = socketController