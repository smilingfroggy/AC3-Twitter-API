const db = require('../models')
const User = db.User
const Like = db.Like
const helpers = require('../_helpers')

const likeController = {
  postLike: (req, res) => {
    Like.findOne({
      where: { $and: {
        UserId: helpers.getUser(req).id,
        TweetId: req.params.tweetId,
      }}
    }).then(like => {
      if (like) {
        return res.json({ status: 'error', message: 'Like added already' })
      }
      Like.create({
        UserId: helpers.getUser(req).id,
        TweetId: req.params.tweetId
      })
        .then(like => {
          return res.json({ status: 'success', message: 'Like added' })
        })
    }).catch(error => {
      console.log(error)
      return res.status(500).json({ status: 'error', message: '發生未預期錯誤，請重新嘗試' })
    })

  },
  postUnlike: (req, res) => {
    Like.findOne({
      where: {
          UserId: helpers.getUser(req).id,
          TweetId: req.params.tweetId,
      }
    }).then(like => {
      if (!like) {
        return res.status(400).json({ status: 'error', message: "尚未喜歡過此內容" })
      }
      like.destroy()
        .then(like => {
          return res.json({ status: 'success', message: 'Removed like successfully'})
        })
    }).catch(error => {
      console.log(error)
      return res.status(500).json({ status: 'error', message: '發生未預期錯誤，請重新嘗試' })
    })
  }
}

module.exports = likeController