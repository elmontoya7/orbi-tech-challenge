const express = require('express')
const cors = require('cors')
const path = require('path')

/** EXPRESS CONFIG */
require('dotenv').config()
const app = express()
app.use(express.json())
app.use(cors())
const server = require('http').createServer(app)

/** MODULES */
require('./modules/mongo')
require('./modules/sendgrid')
app.use(require('./middlewares/userInterceptor'))
app.use(require('./middlewares/pagination'))
const cron = require('node-cron')
const moment = require('moment')
const history = require('connect-history-api-fallback')

const io = require('./modules/socket')(server)
io.on('connection', socket => {
  console.log('socket client connected!');
  socket.emit('welcome', 'connected')
})

/**
 * ROUTES
 */
const staticFileMiddleware = express.static(path.join(__dirname, 'frontend/dist'))


// api endpoints
app.use('/api', require('./routes/api'))

app.use(staticFileMiddleware)

app.use(history({
  index: '/index.html'
}))

app.use(staticFileMiddleware)

// 404 error handler
app.use((req, res, next) => {
  return res.status(404).json({
    success: false,
    error: 'Path not found.'
  })
})

// Global error handler
app.use((err, req, res, next) => {
  return res.status(500).json({
    success: false,
    error: 'Server error.'
  })
})

const { Order } = require('./modules/mongo/models.js')
// every 1 minute
cron.schedule('*/1 * * * *', async () => {
  try {
    const orders = await Order.find({
      status: 'preparando'
    })

    const now = moment()
    for (let order of orders) {
      // if was created more than 5 minutes ago, set status delivered!!!
      console.log(now.diff(moment(order.created_at), 'minutes'));
      if (now.diff(moment(order.created_at), 'minutes') >= 5) {
        await order.updateOne({
          status: 'entregado'
        })

        io.of('/orders').emit('status:update', {...order.toJSON(), status: 'entregado'})
      }
    }
  } catch (e) {
    console.error('Cron Error: ' + e.message)
  }
});

/** START SERVER */
server.listen(process.env.PORT, () => console.log(`App listening on PORT=${process.env.PORT}`))