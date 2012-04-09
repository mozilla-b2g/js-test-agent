var Responder = require('../../test-agent/responder').TestAgent.Responder,
    FileWatcher = require('../watchr'),
    fsPath = require('path');

/**
 * Watcher module for websocket server
 * will emit an event with the test file that changed.
 *
 *    (new Watcher(suite)).enhance(server);
 *
 * @param {Suite} suite object from node/suite
 */
function Watcher(suite){
  this.suite = suite;
}

Watcher.prototype = {

  basePath: '/',
  eventName: 'file changed',

  enhance: function(server){
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

    server.broadcast(Responder.stringify('file changed', {
      testUrl: fsPath.join(this.basePath, info.testPath),
      info: info
    }));
  }

};

module.exports = exports = Watcher;
