const jwt = require('jsonwebtoken')

const TOKEN_EXP = 1000 * 60 * 5
const RESET_TOKEN_EXP = 1000 * 60

/**
 * Create JWT token for session
 * 
 * The token expires in 1 day by default
 */

const createUserToken = (id, expiration = TOKEN_EXP) => {
  return jwt.sign({
    i: id
  },
  process.env.JWT_TOKEN_KEY,
  {
    expiresIn: expiration,
  })
}

const createAdminToken = (id, expiration = TOKEN_EXP) => {
  return jwt.sign({
    i: id,
    a: 'yes'
  },
  process.env.JWT_TOKEN_KEY,
  {
    expiresIn: expiration,
  })
}

const createResetToken = (id, email, old_password, expiration = RESET_TOKEN_EXP) => {
  return jwt.sign({
    u: id,
    email,
    o: old_password
  },
  process.env.JWT_TOKEN_KEY,
  {
    expiresIn: expiration,
  })
}

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_TOKEN_KEY)
}

module.exports = {
  createUserToken,
  createResetToken,
  verifyToken,
  createAdminToken
}