var ws = require('websocket.io'),
    fs = require('fs'),
    fsPath = require('path'),
    Responder = require('../test-agent/responder').TestAgent.Responder,
    vm = require('vm');

function Server(){
  this.implementation = ws;
  this.socket = null;
  this.responder = new Responder();
}

Server.prototype = {

  _createSandbox: function(file){
    return {
      server: this,
      argv: process.argv,
      console: console,
      require: require,
      __file: file,
      __dirname: fsPath.dirname(file)
    };
  },

  /**
   * Exposes a file to the server via a VM.
   *
   * @param {String} file
   * @param {Function} callback
   */
  expose: function(file, callback){
    var sandbox = this._createSandbox(file);
    fs.readFile(file, 'utf8', function(err, code){
      if(err){
        throw err;
      }
      vm.runInNewContext(code, sandbox, file);
      if(callback){
        callback();
      }
    });
  },

  _delegate: function(){
    var args = Array.prototype.slice.call(arguments),
        func = args.shift();

    var imp = this.implementation;
    return imp[func].apply(imp, args);
  },

  /**
   * Delegates to .implementation's attach method
   * and saves result to .socket.
   *
   * @return {Object} result of this.implementation.attach
   */
  attach: function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('attach');

    return this.socket = this._delegate.apply(this, args);
  },

  /**
   * Delegates to .implementation's attach method
   * and saves result to .listen.
   *
   * @return {Object} result of this.implementation.listen
   */
  listen: function(){
    var args = Array.prototype.slice.call(arguments);
    args.unshift('listen');

    return this.socket = this._delegate.apply(this, args);
  }


};

module.exports = exports =  Server;
