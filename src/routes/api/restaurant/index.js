const express = require('express')
const router = express.Router()

router.use('/dish', require('./dish'))
router.use('/modifier', require('./modifier'))

module.exports = router