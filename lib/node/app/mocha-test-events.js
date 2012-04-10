var Reporter = require('../mocha/reporter');

function Mocha(options){
  this.reporter = new Reporter(options);
}

Mocha.prototype = {

  enhance: function(server){
    server.responder.on('test data', this._onTestData.bind(this));
    this.reporter.on('start', this._onRunnerStart.bind(this, server));
  },

  _onTestData: function(data, socket){
    this.reporter.respond(data);
  },

  _onRunnerStart: function(server, runner){
    server.responder.emit('test runner', runner);
  }

};

module.exports = exports = Mocha;
