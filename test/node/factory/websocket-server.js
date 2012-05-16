var WebSocketServer = require_lib('node/websocket-server'),
    Responder = require_lib('test-agent/responder'),
    websocket = require('./websocket').websocket,
    Server;


Server = function() {
  WebSocketServer.apply(this, arguments);
  this.socket = new Responder();
};

Server.prototype = Object.create(WebSocketServer.prototype);

Server.prototype.emitClient = function() {
  this.lastSocket = websocket();
  this.socket.emit('connection', this.lastSocket);

  return this.lastSocket;
};

module.exports = exports = {
  websocketServer: testSupport.factory({

  }, Server)
};
