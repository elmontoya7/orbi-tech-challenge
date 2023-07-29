const express = require('express')
const router = express.Router()

// libraries
const Validator = require('validatorjs')

// models
const { Modifier } = require('../../../../modules/mongo/models')

// helpers
const { userAuthorization } = require('../../../../middlewares/authorization')

router.get('/', userAuthorization, async (req, res) => {
  try {
    const or = []
    const params = {}
    const validFilters = ['name']

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

    if (!req.user.admin) {
      // user cannot see un-available items
      params['available'] = true
    }

    const modifiers = await Modifier.find(params).limit(req.limit).skip(req.skip)
    .sort({
      created_at: -1
    })

    const count = await Modifier.count(params)
  
    return res.json({
      success: true,
      total: count,
      resource: modifiers
    })
  } catch (e) {
    console.error('[GET] /modifiers: ' + e.message)
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

router.post('/', userAuthorization, async (req, res) => {
  try {
    const rules = {
      name: 'required',
      price: 'min:1|required',
      available: 'boolean'
    }
    const validation = new Validator(req.body, rules)
    if (validation.fails()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing params.',
        errors: {
          ...validation.errors.errors
        }
      })
    }

    const { name, price, available=true } = req.body
    try {
      const modifier = new Modifier({
        name,
        price,
        available
      })
      await modifier.save()
      
      return res.json({
        success: true,
        resource: modifier
      })
    } catch (e) {
      console.log(e.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing params.'
      })
    }
  } catch (e) {
    console.error('[POST] /modifier: ' + e.message)
    return res.status(500).json({
      success: false,
      error: 'Something broke. Try again.'
    })
  }
})

router.patch('/:modifier_id', userAuthorization, async (req, res) => {
  try {
    const rules = {
      modifier_id: 'required'
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

    const rules2 = {
      price: 'min:1',
      available: 'boolean'
    }
    const validation2 = new Validator(req.body, rules2)
    if (validation2.fails()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing params.',
        errors: {
          ...validation2.errors.errors
        }
      })
    }

    const { name, price, available } = req.body
    const { modifier_id } = req.params
    
    const updateBody = {
      name,
      price,
      available
    }

    // clear undefined values
    for (let key in updateBody) {
      if (updateBody[key] == null) {
        delete updateBody[key]
      }
    }

    try {
      const modifier = await Modifier.findOneAndUpdate({
        '_id': modifier_id
      }, 
      updateBody,
      {
        new: true
      })
  
      return res.json({
        success: true,
        resource: modifier
      })
    } catch (e) {
      console.log(e.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing params.'
      })
    }
  } catch (e) {
    console.error('[PATCH] /modifier/:modifier_id: ' + e.message)
    return res.status(500).json({
      success: false,
      error: 'Something broke. Try again.'
    })
  }
})

router.delete('/:modifier_id', userAuthorization, async (req, res) => {
  try {
    const rules = {
      modifier_id: 'required'
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

    const { modifier_id } = req.params

    try {
      const modifier = await Modifier.findOneAndDelete({
        '_id': modifier_id
      },
      {
        new: true
      })

      if (!modifier) {
        return res.status(404).json({
          success: false,
          error: 'Not found.'
        })
      }
  
      return res.json({
        success: true,
        resource: modifier
      })
    } catch (e) {
      console.log(e.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing params.'
      })
    }
  } catch (e) {
    console.error('[DELETE] /dish/:dish_id: ' + e.message)
    return res.status(500).json({
      success: false,
      error: 'Something broke. Try again.'
    })
  }
})

module.exports = router