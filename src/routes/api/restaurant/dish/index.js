const express = require('express')
const router = express.Router()

// libraries
const Validator = require('validatorjs')

// models
const { Dish } = require('../../../../modules/mongo/models')

// helpers
const { userAuthorization } = require('../../../../middlewares/authorization')

router.get('/', userAuthorization, async (req, res) => {
  try {
    const or = []
    const params = {}
    const validFilters = ['name', 'category']

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

    const sortParam = {}
    
    const sortBy = req.query.sortBy
    const validSortBy = sortBy != null && (sortBy === 'name' || sortBy === 'category' || sortBy === 'price')
    const order = (req.query.order == 'asc' || req.query.order == '1') ? 1 : -1 // order or descending
    
    if (!validSortBy) {
      sortParam['created_at'] = -1
    } else {
      sortParam[sortBy] = order
    }

    const dishes = await Dish.find(params).limit(req.limit).skip(req.skip)
    .sort(sortParam)
    .populate({
      path: 'modifiers',
      match: req.user.admin ? null : { available: true } // user cannot see un-available items
    })

    const count = await Dish.count(params)
  
    return res.json({
      success: true,
      total: count,
      resource: dishes
    })
  } catch (e) {
    console.error('[GET] /dishes: ' + e.message)
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
      category: 'required|in:entrada,plato fuerte,postre,bebida',
      price: 'min:1|required',
      available: 'boolean',
      modifiers: 'array'
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

    const { name, notes='', category, price, available=true, image, modifiers=[] } = req.body
    try {
      const dish = new Dish({
        name,
        notes,
        category,
        price,
        available,
        image,
        modifiers
      })
      await dish.save()
      
      return res.json({
        success: true,
        resource: dish
      })
    } catch (e) {
      console.log(e.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing params.'
      })
    }
  } catch (e) {
    console.error('[POST] /dish: ' + e.message)
    return res.status(500).json({
      success: false,
      error: 'Something broke. Try again.'
    })
  }
})

router.patch('/:dish_id', userAuthorization, async (req, res) => {
  try {
    const rules = {
      dish_id: 'required'
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
      category: 'in:entrada,plato fuerte,postre,bebida',
      price: 'min:1',
      available: 'boolean',
      modifiers: 'array'
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

    const { name, notes, category, price, available, image, modifiers } = req.body
    const { dish_id } = req.params
    
    const updateBody = {
      name,
      notes,
      category,
      price,
      available,
      image,
      modifiers
    }

    // clear undefined values
    for (let key in updateBody) {
      if (updateBody[key] == null) {
        delete updateBody[key]
      }
    }

    try {
      const dish = await Dish.findOneAndUpdate({
        '_id': dish_id
      }, 
      updateBody,
      {
        new: true
      })
  
      return res.json({
        success: true,
        resource: dish
      })
    } catch (e) {
      console.log(e.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing params.'
      })
    }
  } catch (e) {
    console.error('[POST] /dish/:dish_id: ' + e.message)
    return res.status(500).json({
      success: false,
      error: 'Something broke. Try again.'
    })
  }
})

router.delete('/:dish_id', userAuthorization, async (req, res) => {
  try {
    const rules = {
      dish_id: 'required'
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

    const { dish_id } = req.params

    try {
      const dish = await Dish.findOneAndDelete({
        '_id': dish_id
      },
      {
        new: true
      })

      if (!dish) {
        return res.status(404).json({
          success: false,
          error: 'Not found.'
        })
      }
  
      return res.json({
        success: true,
        resource: dish
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