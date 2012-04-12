var FileWatcher = require('../watchr'),
    fsPath = require('path');

/**
 * REQUIRES: broadcast, suite
 *
 * Watcher module for websocket server
 * will emit an event with the test file that changed.
 *
 * @param {Suite} suite object from node/suite
 */
function Watcher(){}

Watcher.prototype = {

  basePath: '/',
  eventName: 'run tests',

  enhance: function(server){
    this.suite = server.suite;
    this.start(this._onFileChange.bind(this, server));
  },

  start: function(callback){
    this.suite.findFiles(function(err, files){
      if(err){
        throw err;
      }
      var watcher = new FileWatcher(files);
      watcher.start(callback);
    });
  },

  _onFileChange: function(server, file){
    var info = this.suite.testFromPath(file);

    server.broadcast(server.responder.stringify(this.eventName, {
      //todo: maybe buffer changes
      tests: [fsPath.join(this.basePath, info.testPath)]
    }));
  }

};

module.exports = exports = Watcher;
