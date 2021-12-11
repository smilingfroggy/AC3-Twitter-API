const socketController = {
  getMessages: async (roomId) => {
    return await Message.findAll({
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