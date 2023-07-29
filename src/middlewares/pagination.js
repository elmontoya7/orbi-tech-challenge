/**
 * Global Middleware
 * 
 * Pagination middleware, intercepts limit and page from requests and makes them
 * available on req object as limit, page and skip (limit * page - 1)
 * 
 */

const pagination = async (req, res, next) => {
  req.limit = parseInt(req.query.limit || 15)
  req.page = parseInt(req.query.page || 1)
  req.skip = parseInt(req.limit * (req.page - 1))
  return next()
}

module.exports = pagination