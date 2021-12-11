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
      PrivateMessage.create({   //待確認是否儲存成功
        UserId,
        content: "上線",
        type: "notice"
      })
      user = user.toJSON()
      user.content = "上線"
      // console.log(user)
      return user
    })
  },
  savePublicMessages: (data) => { //輸入格式待確認：type要存?
    // { name: "Majer", content: "吃早餐", id: 1, type: "message" }
    // const content = messages.content 解構賦值
    const { content, id } = data
    return Promise.all([
      PublicMessage.create({
        content, UserId: id, // type
      }),
      User.findByPk(id, {
        attributes: ['id', 'name', 'avatar', 'account']
      })
    ])
      .then(([newMessages, user]) => { return ([newMessages, user]) })
  },
  savePrivateMessages: (messages) => { //輸入格式待確認：傳入roomId? type要存?
    // { name: "Majer", content: "吃早餐", id: 1, type: "message" }
    const { content, UserId, type, RoomId } = messages
    return PrivateMessage.create({
      content, UserId, RoomId
    })
  },
  getPublicMessages: () => {
    return PublicMessage.findAll({
      raw: true,
      nest: true,
      include: { model: User, attributes: ['id', 'name', 'avatar', 'account'] },
      attributes: ['content', 'createdAt'],
      order: [['createdAt', 'ASC']]
    })
      .then(messages => {
        console.log(messages)
        const sampleMessages = [
          { content: "阿囉哈", createdAt: "2021-12-10 03:46:51", User: { id: 1, account: 'JENNY', name: 'JEN', avatar: '' } },
          { content: "晚餐吃甚麼？", createdAt: "2021-12-11 03:46:51", User: { id: 2, account: 'JENNY', name: 'JEN', avatar: '' } }
        ]
        return sampleMessages
      })
  },
  getRoomId: (UserId, UserId2) => {   //建立新 private room
    return Room.create({
      UserId, UserId2
    })
      .then(room => { return room.id })
  },
  getPrivateMessages: async (roomId) => {
    return await PrivateMessage.findAll({
      where: { roomId },
      include: { model: User, attributes: ['id', 'name', 'avatar', 'account'] },
      attributes: [
        'content',
        'createdAt'
      ],
      order: [['createdAt', 'ASC']]
    })
  },
}

module.exports = socketController