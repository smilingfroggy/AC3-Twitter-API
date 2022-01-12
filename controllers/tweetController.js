const db = require('../models')
const Tweet = db.Tweet
const User = db.User
const Reply = db.Reply
const helpers = require('../_helpers')

const tweetController = {
  getTweets: (req, res) => {
    Tweet.findAll({
      include: [
        // User,   // Tweet belongsTo User
        { model: User, as: 'User', attributes: ['id', 'name', 'account', 'avatar'] },
        { model: User, as: 'LikedUsers', attributes: ['id', 'name', 'account', 'avatar'] },    // Tweet belongsToMany User, through Like
        Reply
      ],
      order: [['createdAt', 'DESC']]
    })
      .then(tweets => {
        tweets = tweets.map(tweet => ({
          ...tweet.dataValues,
          repliedCount: tweet.Replies.length,
          likedCount: tweet.LikedUsers.length,
          isLiked: helpers.getUser(req).LikedTweets ? helpers.getUser(req).LikedTweets.map(d => d.id).includes(tweet.id) : null
        }))
        tweets.forEach(tweet => {
          delete tweet.Replies
          delete tweet.LikedUsers
        })
        res.json(tweets)
      })
      .catch(error => {
        console.log(error)
        return res.status(500).json({ status: 'error', message: '發生未預期錯誤，請重新嘗試' })
      })
  },
  getTweet: (req, res) => {
    Tweet.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['id', 'name', 'account', 'avatar'] },
        { model: User, as: 'LikedUsers', attributes: ['id', 'name', 'account', 'avatar'] },
        Reply
      ]
    }).then(tweet => {
      if (!tweet) {
        return res.status(400).json({ status: 'error', message: '該推文不存在' })
      }
      tweet.dataValues.likedCount = tweet.LikedUsers.length
      tweet.dataValues.repliedCount = tweet.Replies.length
      tweet.dataValues.isLiked = helpers.getUser(req).LikedTweets ? helpers.getUser(req).LikedTweets.map(d => d.id).includes(tweet.id) : null
      delete tweet.dataValues.Replies
      delete tweet.dataValues.LikedUsers
      return res.json(tweet)
    }).catch(error => {
      console.log(error)
      return res.status(500).json({ status: 'error', message: '發生未預期錯誤，請重新嘗試' })
    })
  },
  postTweet: (req, res) => {
    if (!req.body.description) {
      return res.json({ status: 'error', message: '內容不可空白' })
    }
    Tweet.create({
      description: req.body.description,
      UserId: helpers.getUser(req).id
    }).then(tweet => {
      return res.json({ status: 'success', message: "" })
    }).catch(error => {
      console.log(error)
      return res.status(500).json({ status: 'error', message: '發生未預期錯誤，請重新嘗試' })
    })
  },
}

module.exports = tweetController