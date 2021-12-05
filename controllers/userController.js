const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User
const Tweet = db.Tweet
const Like = db.Like
const Reply = db.Reply

// JWT
const jwt = require('jsonwebtoken')
const passportJWT = require('passport-jwt')
const ExtractJwt = passportJWT.ExtractJwt
const JwtStrategy = passportJWT.Strategy
const imgur = require('imgur')
const tweet = require('../models/tweet')

const userController = {
  signIn: (req, res) => {
    // 檢查必填欄位
    if (!req.body.email || !req.body.password) {
      return res.json({ status: 'error', message: '請輸入必填欄位' })
    }
    // 比對User資料庫、比對密碼
    let { email, password } = req.body
    // console.log('get email, password from jwt strategy: ', email, password)  // OK
    User.findOne({ where: { email } }).then(user => {
      if (!user) {
        return res.status(401).json({ status: 'error', message: '' })
      }
      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ status: 'error', message: '' })
      }
      // issue token
      var payload = { id: user.id }
      var token = jwt.sign(payload, process.env.JWT_SECRET)
      // console.log('token = jwt.sign with', process.env.JWT_SECRET) // OK
      return res.json({
        status: 'success',
        message: 'OK',
        token: token,
        user: {
          id: user.id, name: user.name, account: user.account, email: user.email, role: user.role
        }
      })
    })
  },
  signUp: (req, res) => {
    const { account, name, email, password, checkPassword } = req.body

    // 確認欄位是否皆有填寫
    if (!account || !name || !email || !password || !checkPassword) {
      return res.json({ status: 'error', message: '須田' })
    }
    // 確認密碼
    if (password !== checkPassword) {
      return res.json({ status: 'error', message: '' })
    }

    // 確認email或account是否重複
    User.findOne({
      where: {
        $or: [
          { email },
          { account }
        ]
      }
    }).then(user => {
      if (user) {
        if (user.email === email) {
          return res.json({ status: 'error', message: 'email已重覆註冊！' })
        }
        if (user.account === account) {
          return res.json({ status: 'error', message: 'account已重覆註冊！' })
        }
      } else {
        User.create({
          account, email, name,
          password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10)),
        })
        return res.json({ status: 'success', message: '成功註冊' })
      }
    })
  },
  getUserAccountSetting: (req, res) => {
    const userId = req.params.id
    return User.findByPk(userId)
      .then(user => {
        return res.json({
          user: {
            name: user.name, account: user.account, email: user.email
          }
        })
      })
  },
  putUserAccountSetting: (req, res) => {
    const userId = req.params.id
    const { account, name, email, password, checkPassword } = req.body

    // 確認欄位是否皆有填寫
    if (!account || !name || !email || !password || !checkPassword) {
      return res.json({ status: 'error', message: '須田' })
    }
    // 確認密碼
    if (password !== checkPassword) {
      return res.json({ status: 'error', message: '' })
    }

    // 確認email或account是否重複
    User.findOne({
      where: {
        $or: [
          { email },
          { account }
        ],
        $not: [
          { id: userId }
        ],
      }
    }).then(user => {
      if (user) {
        if (user.email === email) {
          return res.json({ status: 'error', message: 'email已重覆註冊！' })
        }
        if (user.account === account) {
          return res.json({ status: 'error', message: 'account已重覆註冊！' })
        }
      } else {
        return User.findByPk(req.params.id).then(user => {
          user.update({
            account, email, name,
            password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10)),
          })
          return res.json({ status: 'success', message: '成功編輯' })
        })
      }
    })
  },
  getCurrentUser: (req, res) => {
    return User.findAll({
      raw: true,
      nest: true
    }).then(user => {
      return res.json(
        { user }
      )
    })
  },
  /*getUser: (req, res) => {
    const UserId = req.params.id
    return User.findByPk(UserId).then(user => {
      return res.json({
        user: user
      }
      )
    }
    )
  },*/
  getUserInfo: (req, res) => {
    const userId = req.params.id
    return User.findByPk(userId)
      .then(user => {
        return res.json({
          user: {
            name: user.name,
            introduction: user.introduction,
            avatar: user.avatar,
            cover: user.cover
          }
        })
      })
  },
  editUserInfo: (req, res) => {
    const userId = req.params.id
    User.findByPk(userId)
      .then(user => {
        const { name, introduction, avatar, cover } = req.body
        const { files } = req.body
        imgur.setClientId(process.env.IMGUR_CLIENT_ID)
        if (!name) {
          return res.json({ status: 'error', message: 'name為必填欄位' })
        }
        if (files) {
          if (files.cover) {
            // 如果cover更新, 就上傳
            const cover = imgur.uploadFile(files.cover[0].path)
            req.body.cover = cover.link
          }
          if (files.avatar) {
            // 如果avatar更新, 就上傳
            const avatar = imgur.uploadFile(files.avatar[0].path)
            req.body.avatar = avatar.link
          }
        }
        else {
          return User.findByPk(userId).then(user => {
            user.update({
              name, introduction, avatar, cover
            })
            return res.json({ status: 'success', message: '成功編輯' })
          })
        }
      })
  },
  //取得特定瀏覽人次id
  getOneLikes: (req, res) => {
    const UserId = req.params.id
    return Like.findAll({ where: { UserId }, include: [Tweet] })
      .then(tweets => {
        return res.json({ tweets })
      })
  },
  getOneRepliedTweets: (req, res) => {
    const UserId = req.params.id
    return Reply.findAll({ where: { UserId }, include: [Tweet] })
      .then(replies => {
        return res.json({ replies })
      })
  },
  getOneTweets: (req, res) => {
    const UserId = req.params.id
    return Tweet.findAll({ where: { UserId } })
      .then(tweets => {
        return res.json({ tweets })
      })
  },
}



module.exports = userController