const db = require('../models')
const User = db.User
const Followship = db.Followship
const helpers = require('../_helpers')
const { Op } = require("sequelize");

const followController = {
  addFollowship: (req, res) => {
    Followship.findOne({  //TODO: 可優化成findOrCreate
      where: {
        [Op.and]: {
          followerId: helpers.getUser(req).id,
          followingId: req.body.id
        }
      }
    }).then(followship => {
      if (followship) {
        return res.json({ status: 'error', message: 'Followed already' })
    }).then(([_followship, created]) => {
      if (!created) {
        return res.status(400).json({ status: 'error', message: '跟隨中' })
      }
      Followship.create({
        followerId: helpers.getUser(req).id,
        followingId: req.body.id
      }).then(() => {
        return res.json({ status: 'success', message: 'Followed successfully' })
      })
    }).catch(error => {
      console.log(error)
      return res.status(500).json({ status: 'error', message: '發生未預期錯誤，請重新嘗試' })
    })
  },
  deleteFollowship: (req, res) => {
    Followship.destroy({
      where: {
        [Op.and]: {
          followerId: helpers.getUser(req).id,
          followingId: req.params.followingId
        }
      }
    }).then(followship => {
      if (!followship) {
        return res.status(400).json({ status: 'error', message: '沒有跟隨' })
      }
      return res.json({ status: 'success', message: 'Unfollowed successfully' })
    }).catch(error => {
      console.log(error)
      return res.status(500).json({ status: 'error', message: '發生未預期錯誤，請重新嘗試' })
    })
  }, getTopFollowers: (req, res) => {
    return User.findAll({
      where: { role: { [Op.is]: null } },  // 排除管理者
      include: [{
        model: User, as: 'Followers',
        attributes: ['id', 'name', 'account', 'avatar'],
      }],
      attributes: ['id','name','account','avatar'],
    }).then(users => {
      users = users.map(user => ({
        ...user.dataValues,
        FollowerCount: user.Followers.length, //追蹤者人數
        // isFollowed: 是否被登入中的使用者追蹤
        isFollowed: req.user.Followings.map(d => d.id).includes(user.id)
      }))
      users = users.sort((a, b) => b.FollowerCount - a.FollowerCount).slice(0, 10)
      users.forEach(user => {delete user.Followers})
      return res.json(users)
    }).catch(error => {
      console.log(error)
      return res.status(500).json({ status: 'error', message: '發生未預期錯誤，請重新嘗試' })
    })
  }
}


module.exports = followController