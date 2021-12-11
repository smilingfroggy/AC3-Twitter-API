const socketController = require('../controllers/socketController')
const { generateMessage } = require('./message')

module.exports = (server) => {

  const io = require('socket.io')(server)
  const chat_Msg = '123'

  io.on('public chat', async (chat_Msg) => {
    console.log('=== receive public chat message ===')
    await socketController.storeMessage(chat_Msg)
    io.emit('notice', '收到聊天室訊息')
    io.emit('public chat', generateMessage('chat_Msg'))
  })


}