const db = require('../models')
const Like = db.Like
const helpers = require('../_helpers')

const likeController = {
  postLike: (req, res) => {
    Like.findOrCreate({
      where: {
        UserId: helpers.getUser(req).id,
        TweetId: req.params.tweetId
      }
    }).then(([like, created]) => {
      if (!created) {
        return res.status(400).json({ status: 'error', message: '已按過喜歡' })
      }
      return res.json({ status: 'success', message: '成功加入喜歡的推文' })
    }).catch(error => {
      console.log(error)
      return res.status(500).json({ status: 'error', message: '發生未預期錯誤，請重新嘗試' })
    })
  },
  postUnlike: (req, res) => {
    Like.destroy({
      where: {
        UserId: helpers.getUser(req).id,
        TweetId: req.params.tweetId
      }
    }).then(like => { //destroy count
      if (!like) {
        return res.status(400).json({ status: 'error', message: "尚未喜歡過此內容" })
      }
      return res.json({ status: 'success', message: '已成功將此內容從喜歡的推文移除' })
    }).catch(error => {
      console.log(error)
      return res.status(500).json({ status: 'error', message: '發生未預期錯誤，請重新嘗試' })
    })
  }
}

module.exports = likeController