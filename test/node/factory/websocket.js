var Responder = require('../../../lib/test-agent/responder').TestAgent.Responder,
    WebSocket = require('./event-object');

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

