const socket = require('socket.io')
let io

const initialize = function (server) {
  if (!!server && !io)
    return io = socket(server)
  else
    return io
}

module.exports = initialize