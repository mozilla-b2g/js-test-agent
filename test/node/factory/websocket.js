var Responder = require('../../../lib/test-agent/responder'),
    WebSocket = require('./event-object');

module.exports = exports = {
  wsKey: 0,

  websocket: testSupport.factory({
    sendCalls: function() {
      return [];
    },

    sent: function() {
      return [];
    },

    open: function(){
      return true;
    },

    req: function() {
      return {
        headers: {
          'sec-websocket-key': exports.wsKey += 1
        }
      };
    },

    send: function(attrs) {
      return function(data) {
        this.sendCalls.push(Array.prototype.slice.call(arguments));
        try {
          this.sent.push(Responder.parse(data));
        } catch(e) {
        }
      };
    }
  }, WebSocket)

};

