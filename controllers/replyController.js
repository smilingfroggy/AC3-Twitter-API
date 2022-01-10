const db = require('../models')
const User = db.User
const Reply = db.Reply
const helpers = require('../_helpers')

const replyController = {
  getReplies: (req, res) => {
    Reply.findAll({
      where: { TweetId: req.params.tweetId },
      include: User,
      order: [['createdAt', 'DESC']]
    }).then((replies) => {
      replies.forEach(reply => {  // 把User.password刪掉
        reply.dataValues.User.password = ""
        // delete reply.dataValues.User.password 無作用
      })
      return res.json(replies)
    }).catch(error => {
      console.log(error)
      return res.status(500).json({ status: 'error', message: '發生未預期錯誤，請重新嘗試' })
    })
  },
  postReply: (req, res) => {
    if (!req.body.comment) {
      return res.status(400).json({ status: 'error', message: '請輸入回應內容' })
    }
    if (req.body.comment.length >= 280) {
      return res.status(400).json({ status: 'error', message: '回應內容超過上限' })
    }
    Reply.create({
      TweetId: req.params.tweetId,
      UserId: helpers.getUser(req).id,
      comment: req.body.comment
    }).then(() => {
      return res.json({ status: 'success', message: '' })
    }).catch(error => {
      console.log(error)
      return res.status(500).json({ status: 'error', message: '發生未預期錯誤，請重新嘗試' })
    })
  }
}


module.exports = replyController