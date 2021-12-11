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
      .then(([newMessages, user]) => {
        user = user.toJSON()
        const newMessages = { room: RoomId }  // 外面再包一個roomID
        newMessages.room.newMessages = newMessages
        newMessages.room.user = user
        return (newMessages)
      })
  },
  getPrivateMessages2: (RoomId) => {    // Room難以2次關連到 userId, 
    return Room.findByPk(RoomId, {
      include: { model: User, }
    })
  },
  getPrivateMessages: (UserId) => {   // 跟使用者有關的所有歷史訊息(而不是roomID)
    return PrivateMessage.findAll({
      raw: true,
      nest: true,
      where: { $or: { 
        senderId: UserId, 
        receiverId: UserId
      } },    // 不用RoomId找
      include: { model: User, attributes: ['id', 'name', 'avatar', 'account'] },
      attributes: ['id', 'content', 'createdAt'],
      order: [['createdAt', 'ASC']]
    })
      .then(messages => {     // 
        
      })
  },
}

module.exports = socketController