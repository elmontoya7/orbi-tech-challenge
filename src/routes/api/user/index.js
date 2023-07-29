const express = require('express')
const router = express.Router()

const Validator = require('validatorjs')

const { userAuthorization } = require('../../../middlewares/authorization')
const { User } = require('../../../modules/mongo/models')

router.get('/', userAuthorization, async (req, res) => {
  try {
    const or = []
    const params = {}
    const validFilters = []

    // {'name': {'$regex': 'sometext', '$options': 'i'}}

    for (let key of validFilters) {
      let value = req.query[key]

      if (value != null && value != '') {
        or.push({
          [key]: {
            '$regex': value,
            '$options': 'i'
          }
        })
      }
    }

    if (or.length) {
      params['$or'] = or
    }

    if (!req.query.cancel || req.query.cancel === 'false') {
      params['status'] = { $ne: 'cancelado' }
    }

    const users = await User.find(params).limit(req.limit).skip(req.skip)
    .sort({
      updated_at: -1
    })

    const count = await User.count(params)
  
    return res.json({
      success: true,
      total: count,
      resource: users
    })
  } catch (e) {
    console.error('[GET] /users: ' + e.message)
    if (e.message.includes('Cast to ObjectId failed for value')) {
      return res.status(404).json({
        success: false,
        error: 'Not found with provided id.'
      })
    } else {
      return res.status(500).json({
        success: false,
        error: 'Something broke. Try again.'
      })
    }
  }
})

router.patch('/:user_id/block', userAuthorization, async (req, res) => {
  try {
    const rules = {
      user_id: 'required'
    }
    const validation = new Validator(req.params, rules)
    if (validation.fails()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing params.',
        errors: {
          ...validation.errors.errors
        }
      })
    }

    const { user_id } = req.params

    try {
      const user = await User.findOneAndUpdate({
        '_id': user_id
      },
      {
        blocked: true
      },
      {
        new: true
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Not found.'
        })
      }
  
      return res.json({
        success: true,
        resource: user
      })
    } catch (e) {
      console.log(e.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing params.'
      })
    }
  } catch (e) {
    console.error('[PATCH] /user/:user_id/block: ' + e.message)
    return res.status(500).json({
      success: false,
      error: 'Something broke. Try again.'
    })
  }
})

module.exports = router