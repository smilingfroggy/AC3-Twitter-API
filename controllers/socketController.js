const db = require('../models')
const User = db.User
const PublicMessage = db.PublicMessage
const PrivateMessage = db.PrivateMessage
const Room = db.Room
const { Op, Sequelize } = require("sequelize");

const socketController = {
  getUser: (UserId) => {
    return User.findByPk(UserId, {
      attributes: ['id', 'name', 'avatar', 'account']
    }).then(user => {
      user = user.toJSON()
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
        return messages
      })
  },
  getUnReadCount: (UserId) => {
    return PrivateMessage.findAll({
      raw: true,
      where: {
        receiverId: UserId,
        isRead: false
      }
    }).then(unreadMessages => {
      return unreadMessages.length
    })
  },
  getRoomId: (data) => {   //建立新 private room
    let [id, id2] = [data.senderId, data.receiverId]
    const userArray = [id, id2]
    userArray.sort((id, id2) => id - id2) // 改為升冪排序

    return Room.findOrCreate({   //+ include user
      where: { UserId: userArray[0], UserId2: userArray[1] }
    })
      .then(room => { return room[0].id })
  },
  getAllUserRoomId: (UserId) => {
    return Room.findAll({
      raw: true,
      where: { [Op.or]: [{ UserId }, { UserId2: UserId }] },
    }).then((rooms) => {
      return rooms
    })
  },
  savePrivateMessages: (data, RoomId) => {
    const { content, receiverId, senderId: UserId } = data
    return Promise.all([
      PrivateMessage.create({
        content, receiverId, UserId, RoomId, isRead: false
      }),
      User.findByPk(UserId, {
        attributes: ['id', 'name', 'avatar', 'account']
      })
    ])
      .then(([privateMessages, user]) => {
        privateMessages = privateMessages.toJSON()
        user = user.toJSON()
        const newMessages = { room: RoomId }  // 外面再包一個roomID---待確認是否還需要外面包room
        newMessages.newMessages = privateMessages
        newMessages.user = user
        return (newMessages)
      })
  },
  getRoomPrivateMessages: (RoomId) => {   //特定roomId所有歷史訊息
    return PrivateMessage.findAll({
      where: { RoomId },
      order: [['createdAt', 'ASC']],
      include: { model: User, attributes: ['id', 'name', 'avatar', 'account'] },  //sender info
    }).then((privateMessages) => {
      return privateMessages
    })
  },
  getLatestPrivateMessages: (UserId) => {   // 前端：使用者每個私人聊天室的最新歷史訊息
    return PrivateMessage.findAll({
      raw: true,
      nest: true,
      where: {
        [Op.or]: {
          UserId: UserId,
          receiverId: UserId
        }
      },
      group: 'RoomId',
      order: [['createdAt', 'ASC']],
      // order: [[Sequelize.fn('max', Sequelize.col('PrivateMessage.createdAt')), 'DESC']], //Column 'createdAt' in field list is ambiguous (需與 model: User 區隔)
      // => PrivateMessage.createdAt
      attributes: [[Sequelize.fn('max', Sequelize.col('PrivateMessage.createdAt')), 'createdAt']],
      //fn max 放attributes裡面，只有createdAt是最新的時間，但是content頂其他內容沒有對應到最新資訊
    })
      .then(async (latestCreatTime) => {
        let latestMessages = []
        for (let eachTime of latestCreatTime) {
          await PrivateMessage.findOne({
            raw: true,
            nest: true,
            where: {
              [Op.or]: {
                UserId: UserId,
                receiverId: UserId
              },
              createdAt: eachTime.createdAt
            },
            order: [['createdAt', 'ASC']],
            include: { model: User, attributes: ['id', 'name', 'avatar', 'account'] },  //sender info
          })
            .then(msg => {
              return latestMessages.push(msg)
            })
        }
        return latestMessages
      })
  },
  readPrivateMessages: (currentUserId, RoomId) => {  // currentUser是receiver的未讀訊息，要改成已讀
    return PrivateMessage.update({ isRead: true }, {
      where: {
        RoomId,
        receiverId: currentUserId,
        isRead: false
      }
    })
  }
}

module.exports = socketController