var PoolBase = require('../../lib/test-agent/pool-base').TestAgent.PoolBase;

function WebsocketPool() {
  PoolBase.apply(this, arguments);
}

WebsocketPool.HEADER_KEY = 'sec-websocket-key';

WebsocketPool.prototype = Object.create(PoolBase.prototype);

WebsocketPool.prototype.objectDetails = function(object) {
  var result = {};

  result.key = object.req.headers[WebsocketPool.HEADER_KEY];
  result.value = object;

  return result;
};

WebsocketPool.prototype.checkObjectValue = function(value) {
  return (!('socket' in value) || !value.socket.destroyed);
};

/**
 * Sends a message to each socket (via .send)
 *
 * @param {String} message
 */
WebsocketPool.prototype.broadcast = function(message) {
  this.each(this._broadcastEach.bind(this, message));
};

WebsocketPool.prototype._broadcastEach = function(message, socket) {
  socket.send(message);
};


module.exports = exports = WebsocketPool;
