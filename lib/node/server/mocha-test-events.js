var Reporter = require('../mocha/reporter');

/**
 * REQUIRES: responder
 *
 * Provides a listener for test data events
 * to stream reports to the servers console.
 */
function Mocha(options){
  this.reporter = new Reporter(options);
}

Mocha.prototype = {

  enhance: function(server){
    server.on('test data', this._onTestData.bind(this));
    this.reporter.on('start', this._onRunnerStart.bind(this, server));
  },

  _onTestData: function(data, socket){
    this.reporter.respond(data);
  },

  _onRunnerStart: function(server, runner){
    server.emit('test runner', runner);
  }

};

module.exports = exports = Mocha;
