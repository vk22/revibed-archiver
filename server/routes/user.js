const express = require('express')
const router = express.Router()
// const jwt = require('jsonwebtoken')
// const multer = require('multer')
// const fs = require('fs-extra')
// const rimraf = require('rimraf')
// const bcrypt = require('bcrypt')
const config = require('../config/config')
const users = config.users
// const orderFolderName = config.orderFolderName

const MyAuth = require('../controllers/auth.js')
// First instantiate the class
const auth = new MyAuth({
  configName: 'user-auth'
})

function uniqueIDGenerate() {
  function chr4() {
    return Math.random().toString(16).slice(-4)
  }
  return (
    chr4() + chr4() + '-' + chr4() + '-' + chr4() + '-' + chr4() + '-' + chr4() + chr4() + chr4()
  )
}

router.post('/api/login', (req, res) => {
  const key = req.body.key
  // const password = req.body.password

  console.log('login ', key)

  if (!key)
    return res.status(400).json({
      type: 'error',
      message: 'email and password fields are essential for authentication.'
    })

  const findUser = users.find((item) => item.key === key)
  console.log('findUser ', findUser)

  const getCandidate = auth.get()
  if (!getCandidate.length) {
    const saveRip = auth.set(findUser)
    if (!saveRip) {
      console.log('save User error')
    }
  }

  if (findUser) {
    res.json({
      success: true,
      message: 'User logged in.',
      user: findUser
    })
  } else {
    res.status(403).json({ type: 'error', message: 'User not exist' })
  }

  // User.findOne({ username: username }, function (err, user) {
  //   if (err) {
  //     console.log(err)
  //   } else {
  //     if (user) {
  //       bcrypt.compare(password, user.passwordHash, (error, result) => {
  //         if (error) return res.status(401).send({ success: false, msg: 'Authentication failed. Wrong password.' + req.body.password })
  //         if (result) {
  //           res.json({
  //             success: true,
  //             message: 'User logged in.',
  //             user: { username: user.username, email: user.email, id: user._id, port: user.port, src: user.streamSrc, usergroup: user.usergroup },
  //             token: jwt.sign({ username: user.username, email: user.email, id: user._id, port: user.port, src: user.streamSrc, usergroup: user.usergroup }, config.jwtToken, { expiresIn: '7d' })
  //           })
  //         } else return res.status(403).json({ type: 'error', message: 'Password is incorrect.' })
  //       })
  //     } else {
  //       return res.status(403).json({ type: 'error', message: 'User not exist' })
  //     }
  //   }
  // })
})

router.get('/api/getuser', (req, res) => {
  const getCandidate = auth.get()
  console.log('getCandidate ', getCandidate)

  if (getCandidate.length) {
    res.json({
      success: true,
      message: 'User exist.',
      user: getCandidate[0]
    })
  } else {
    // res.status(403).json({ type: 'error', message: 'User not exist' })
    res.json({
      success: false,
      message: 'No User'
    })
  }
})

router.post('/api/logout', (req, res) => {
  const delUser = auth.delete()
  if (!delUser) return
  res.status(200).json({ status: 1, message: 'You are logged in', token: '' })
})

getToken = function (headers) {
  if (headers && headers.authorization) {
    const parted = headers.authorization.split(' ')
    if (parted.length === 2) {
      return parted[1]
    } else {
      return null
    }
  } else {
    return null
  }
}

module.exports = router
