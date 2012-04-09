var Responder = require('../../../lib/test-agent/responder').TestAgent.Responder,
    WebSocket;


WebSocket = function(attrs){
  var key;
  for(key in attrs){
    if(attrs.hasOwnProperty(key)){
      this[key] = attrs[key];
    }
  }
  Responder.call(this);
};

WebSocket.prototype = Object.create(Responder.prototype);

module.exports = exports = {
  wsKey: 0,

  websocket: testSupport.factory({
    sendCalls: function(){
      return [];
    },

    req: function(){
      return {
        headers: {
          'sec-websocket-key': exports.wsKey += 1
        }
      };
    },

    send: function(attrs){
      return function(){
        this.sendCalls.push(Array.prototype.slice.call(arguments));
      };
    }
  }, WebSocket)

};

