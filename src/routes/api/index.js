const express = require('express')
const router = express.Router()

/** ROUTES */
router.get('/', (req, res) => {
  return res.send('API v1')
})

router.use('/auth', require('./auth'))
router.use('/restaurant', require('./restaurant'))
router.use('/order', require('./order'))
router.use('/user', require('./user'))

module.exports = router