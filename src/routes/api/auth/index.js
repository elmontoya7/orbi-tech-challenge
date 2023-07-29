const express = require('express')
const router = express.Router()

// libraries
const Validator = require('validatorjs')
const bcrypt = require('bcryptjs')
const sgMail = require('../../../modules/sendgrid')

// models
const { User } = require('../../../modules/mongo/models')

// helpers
const { createUserToken, createAdminToken } = require('../../../helpers/tokens')
const { userAuthorization } = require('../../../middlewares/authorization')

router.get('/me', userAuthorization, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)

    return res.json({
      success: true,
      resource: {
        ...user.toJSON(),
        is_admin: req.user.admin
      }
    })
  } catch (e) {
    console.error('[GET] /me: ' + e.message)
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

router.post('/login', async (req, res) => {
  try {
    const rules = {
      email: 'required|email',
      password: 'required'
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

    const { email, password, admin } = req.body
    try {
      const user = await User.findOne({
        'email': email
      })

      if (!user) {
        // return 401 to not share if the user exists or not
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials.'
        })
      }

      // validate compare password
      const isPasswordValid = await bcrypt.compare(password, user.password)
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials.'
        })
      }

      if (user.blocked) {
        return res.status(403).json({
          success: false,
          error: 'User has been disabled for security reasons.'
        })
      }

      // generate session token and append to response resource
      const token = admin === 'yes' ? createAdminToken(user._id) : createUserToken(user._id)

      return res.json({
        success: true,
        resource: {
          ...user.toJSON(),
          access_token: token,
          is_admin: admin === 'yes'
        }
      })
    } catch (e) {
      console.log(e.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing params.'
      })
    }
  } catch (e) {
    console.error('[POST] /login: ' + e.message)
    return res.status(500).json({
      success: false,
      error: 'Something broke. Try again.'
    })
  }
})

router.post('/register', async (req, res) => {
  try {
    const rules = {
      email: 'required|email',
      password: 'required',
      name: 'required'
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

    const { email, password, name } = req.body
    try {
      const foundUser = await User.findOne({
        'email': email
      })

      if (foundUser) {
        // return 401 to not share if the user exists or not
        return res.status(400).json({
          success: false,
          error: 'A user with email ' + email + ' already exists.'
        })
      }

      // encrypt password before save in db
      const encryptedPassword = await bcrypt.hash(password, 8)

      const user= new User({
        email,
        password: encryptedPassword,
        name
      })
      await user.save()

      const token = createUserToken(user._id)

      try {
        const msg = {
          to: email,
          from: 'no-reply@destradigital.com',
          template_id: 'd-f802dc22765d4ef19ce70e6b54f467e9',
          dynamic_template_data: {
            title: name,
            message: '¡Bienvenido a Taco Feliz! Tu cuenta está lista para usarse. A partir de ahora puedes pedir tu comida favorita desde la app.'
          },
        }
  
        const emailRes = await sgMail.send(msg)
        if (emailRes[0].statusCode == 202) {
          console.log('Email sent to', email, '::', emailRes[0].statusCode)
        } else {
          console.log('Error sending email to email', email, '::', emailRes[0].statusCode)
        }
      } catch (e) {
        console.error(e)
      }

      return res.json({
        success: true,
        resource: {
          ...user.toJSON(),
          access_token: token
        }
      })
    } catch (e) {
      console.log(e.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing params.'
      })
    }
  } catch (e) {
    console.error('[POST] /regsiter: ' + e.message)
    return res.status(500).json({
      success: false,
      error: 'Something broke. Try again.'
    })
  }
})

router.get('/refresh-token', userAuthorization, async (req, res) => {
  try {
    /** 
     * 
     * Token is validated by middleware /authorization.js from header x-auth-user
     * 
     * */

    try {
      const user = await User.findOne({
        '_id': req.user.id
      })

      if (!user) {
        return res.status(403).json({
          success: false,
          error: 'Invalid user.'
        })
      }

      if (user.blocked) {
        return res.status(403).json({
          success: false,
          error: 'User has been disabled for security reasons.'
        })
      }

      // generate session token and append to response resource
      // get user id from token
      const token = createUserToken(user.id)

      return res.json({
        success: true,
        resource: {
          access_token: token
        }
      })
    } catch (e) {
      console.log(e.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing params.'
      })
    }
  } catch (e) {
    console.error('[GET] /refresh-token: ' + e.message)
    return res.status(500).json({
      success: false,
      error: 'Something broke. Try again.'
    })
  }
})

module.exports = router