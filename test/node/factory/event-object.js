var Responder = require('../../../lib/test-agent/responder'),
    EventObject;

EventObject = function(attrs) {
  var key;
  for (key in attrs) {
    if (attrs.hasOwnProperty(key)) {
      this[key] = attrs[key];
    }
  }
  Responder.call(this);
};

EventObject.prototype = Object.create(Responder.prototype);

module.exports = exports = EventObject;

