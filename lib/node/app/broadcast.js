var WebSocketPool = require('../websocket-pool');

function Broadcast(){
  this.pool = new WebSocketPool();
}

Broadcast.prototype.enhance = function(server){
  server.socket.on('connection', this._onConnection.bind(this));
  server.broadcast = this._broadcast.bind(this);
};

Broadcast.prototype._broadcast = function(message){
  this.pool.broadcast(message);
};

Broadcast.prototype._onConnection = function(socket){
  this.pool.add(socket);

  socket.on('close', this._onConnectionClose.bind(this, socket));
};

Broadcast.prototype._onConnectionClose = function(socket){
  this.pool.remove(socket);
};

module.exports = exports = Broadcast;
