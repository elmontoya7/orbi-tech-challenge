const { verifyToken } = require('../helpers/tokens')

const userAuthorization = async (req, res, next) => {
  req.user = {}

  try {
    const decoded = verifyToken(req.authToken)

    req.user = {
      id: decoded.i,
      admin: decoded.a === 'yes'
    }
  } catch (e) {
    if (e.message == 'jwt expired') {
      return res.status(403).json({
        success: false,
        error: 'Token expired.'
      })
    } else {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized.'
      })
    }
  }

  return next()
}

module.exports = {
  userAuthorization
}