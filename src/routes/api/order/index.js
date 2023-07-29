const express = require('express')
const router = express.Router()

// libraries
const Validator = require('validatorjs')
const bcrypt = require('bcryptjs')
const sgMail = require('../../../modules/sendgrid')
const valid = require('card-validator')
const io = require('../../../modules/socket')()

// models
const { User, Dish, Order } = require('../../../modules/mongo/models')

// helpers
const { userAuthorization } = require('../../../middlewares/authorization')

io.of('/orders').on('connection', socket => {
  console.log('socket client connected to /orders');
  socket.emit('welcome', 'you')
})

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

    const orders = await Order.find(params).limit(req.limit).skip(req.skip)
    .sort({
      updated_at: -1
    })

    const count = await Order.count(params)
  
    return res.json({
      success: true,
      total: count,
      resource: orders
    })
  } catch (e) {
    console.error('[GET] /orders: ' + e.message)
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

const orderEndpoint = async (req, res) => {
  try {
    const rules = {
      user_id: 'required',
      items: 'required',
      'items.*.dish_id': 'required',
      'items.*.modifiers.*': 'required',
      tip: 'integer|required|in:0,5,10,15',
      address_line_1: 'required',
      address_line_2: 'required',
      pay_on_delivery: 'boolean|required',
      card_number: 'required_if:pay_on_delivery,false',
      card_exp_date: 'required_if:pay_on_delivery,false' // mm/yyyy required
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

    const { user_id, items, tip, address_line_1, address_line_2, pay_on_delivery, card_number, card_exp_date } = req.body
    let total = 0, subtotal = 0, dishes_total = 0, modifiers_total = 0, tip_total = 0

    try {
      // validate card
      if (!pay_on_delivery && (!card_number || !card_exp_date || !valid.number(card_number).isValid || !validCardExpDate(card_exp_date)) ) {
        return res.status(400).json({
          success: false,
          error: 'Payment card data is not valid'
        })
      }

      // query user
      const user = await User.findOne({ _id: user_id })
      if (!user) {
        return res.status(400).json({
          success: false,
          error: 'User not found with provided id'
        })
      } else if (user.blocked) {
        return res.status(403).json({
          success: false,
          error: 'User has been disabled for security reasons.'
        })
      }

      // query items
      const Items = await Dish.find({ _id: { $in: items.map(i => i.dish_id) } }).populate('modifiers')

      if (!Items.length) {
        return res.status(400).json({
          success: false,
          error: 'Items must not be empty'
        })
      }

      // for quicker data access convert to object
      const itemsDict = {}
      for (let i of items) {
        itemsDict[i.dish_id] = i.modifiers ? [...i.modifiers] : []
      }

      const orderItems = []

      // parse items and add total prices for dishes and modifiers
      for (let item of Items) {
        const orderItem = {
          dish: {
            id: item._id,
            name: item.name,
            price: item.price,
            image: item.image
          },
          modifiers: []
        }

        dishes_total += item.price

        const modifiers = itemsDict[item._id]
        for (let m of item.modifiers) {
          if (!modifiers.includes(m._id.toString())) continue
          modifiers_total += m.price
          orderItem.modifiers.push({
            id: m._id,
            name: m.name,
            price: m.price
          })
        }

        orderItems.push(orderItem)
      }

      // calculate subtotal
      subtotal = dishes_total + modifiers_total

      if (tip != 0) {
        const Tip = parseInt(tip)
        if (Tip === 5 || Tip === 10 || Tip === 15) {
          tip_total = subtotal * (Tip / 100)
        }
      }

      total = subtotal + tip_total

      const object = {
        user: {
          id: user._id,
          name: user.name
        },
        items: orderItems,
        total_dishes: dishes_total,
        total_modifiers: modifiers_total,
        tip: tip_total,
        subtotal,
        total,
        address: {
          line_1: address_line_1,
          line_2: address_line_2
        },
        payment: {
          pay_on_delivery,
          card_number,
          card_exp_date
        }
      }

      if (req.checkout === true) {
        return res.json({
          success: true,
          resource: object
        })
      } else {
        const order = new Order(object)
        await order.save()

        // update dashboard
        io.of('/orders').emit('create', order)

        // send email to client
        try {
          const msg = {
            to: user.email,
            from: 'no-reply@destradigital.com',
            template_id: 'd-f802dc22765d4ef19ce70e6b54f467e9',
            dynamic_template_data: {
              title: user.name + ' tu orden se está preparando',
              message: 'Te confirmamos que hemos recibido tu orden y la estamos preparando. Aquí el resumen de tu pedido:',
              items: orderItems.map(i => {
                return {
                  name: i.dish.name,
                  price: '$' + i.dish.price
                }
              })
            },
          }
    
          const emailRes = await sgMail.send(msg)
          if (emailRes[0].statusCode == 202) {
            console.log('Email sent to', user.email, '::', emailRes[0].statusCode)
          } else {
            console.log('Error sending email to email', user.email, '::', emailRes[0].statusCode)
          }
        } catch (e) {
          console.error(e)
        }

        return res.json({
          success: true,
          resource: order
        })
      }
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
}

router.post('/', userAuthorization, orderEndpoint)
router.post('/checkout', userAuthorization, (req, res, next) => {
  req.checkout = true
  next()
}, orderEndpoint)

const validCardExpDate = (date) => {
  const values = date.split('/')
  console.log(values, validCardMonth(values[0]), validCardYear(values[1]));
  return validCardMonth(values[0]) && validCardYear(values[1])
}

const validCardYear = (year) => {
  const currentYear = new Date().getFullYear()
  const parsedYear = parseInt(year)
  if (isNaN(year)) return false
  if (parsedYear >= currentYear) return true

  return false
}

const validCardMonth = (month) => {
  const parsedMonth = parseInt(month)
  return parsedMonth >= 0 && parsedMonth <= 12
}

router.post('/:order_id/cancel', userAuthorization, async (req, res) => {
  try {
    const rules = {
      order_id: 'required'
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

    const { order_id } = req.params

    try {
      const order = await Order.findOneAndUpdate({
        '_id': order_id,
        status: 'preparando'
      },
      {
        status: 'cancelado'
      },
      {
        new: true
      })

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Not found or unable to cancel.'
        })
      }
  
      return res.json({
        success: true,
        resource: order
      })
    } catch (e) {
      console.log(e.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing params.'
      })
    }
  } catch (e) {
    console.error('[POST] /order/:order_id/cancel: ' + e.message)
    return res.status(500).json({
      success: false,
      error: 'Something broke. Try again.'
    })
  }
})

module.exports = router