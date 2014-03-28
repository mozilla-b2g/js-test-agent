var MatchFiles = require('match-files');
/**
 * REQUIRES: suite, responder, broadcast
 *
 * When server recieves siginal to start tests
 * will tell every client to run all or some tests.
 * If no clients are connected, will wait for a connect
 * event before broadcasting the run tests signal
 */
function StartTests() {
  this.clientReady = false;
  this.testQueue = [];
}

StartTests.prototype = {

  eventNames: {
    connect: 'worker ready',
    start: 'queue tests',
    sendEvent: 'run tests'
  },

  enhance: function enhance(server) {
    server.on(this.eventNames.connect, this._onWorkerReady.bind(this, server));
    server.on(this.eventNames.start, this._startTests.bind(this, server));
  },

  _onWorkerReady: function _onWorkerReady(server) {
    this.clientReady = true;
    var testData = null;
    // run any tests that have already been queued
    while (this.testQueue.length > 0) {
      testData = this.testQueue.shift();
      this._startTests(server, testData);
    }
  },

  _startTests: function _startTests(server, data) {
    var options = { fileFilters: [] };
    // if there are no clients connected
    // simply store the test data for now
    if (!this.clientReady) {
      this.testQueue.push(data);
      return;
    }

    if (data && data.app && typeof data.app === 'string') {
      options.fileFilters.push(function(path) {
        var reg = new RegExp('^(\\w+/)?' + data.app + '/');
        return reg.test(path);
      });
    }

    server.suite.findTestFiles(function(err, files) {
      this._broadCastFiles(server, files);
    }.bind(this), options);
  },

  _broadCastFiles: function _broadCastFiles(server, files) {
    var list = files.map(function(file) {
      var result = server.suite.testFromPath(file);
      return result.testUrl;
    });

    server.broadcast(server.stringify(this.eventNames.sendEvent, {tests: list}));
  }

};

module.exports = exports = StartTests;
