/**
 * Global Middleware
 * 
 * Extracts token passed as x-auth-user header and 
 * makes it available in req.authToken
 * 
 */

const userInterceptor = async (req, res, next) => {
  req.authToken = req.headers['x-auth-user']
  return next()
}

module.exports = userInterceptor