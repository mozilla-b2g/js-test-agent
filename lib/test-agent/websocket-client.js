//depends on TestAgent.Responder
(function(exports){
  if(typeof(exports.TestAgent) === 'undefined'){
    exports.TestAgent = {};
  }

  var Native, Responder;

  //Hack Arounds for node
  if(typeof(window) === 'undefined'){
    Native = require('ws');
    Responder = require('./responder').TestAgent.Responder;
  }

  Responder = Responder || TestAgent.Responder;
  Native = (Native || WebSocket || MozWebSocket);

  //end


  /**
   * Creates a websocket client handles custom
   * events via responders and auto-reconnect.
   *
   * Basic Options:
   *  - url: websocekt endpoint (for example: "ws://localhost:8888")
   *
   * Options for retries:
   *
   *  - retry (false by default)
   *  - retries (current number of retries)
   *  - retryLimit ( number of retries before error is thrown Infinity by default)
   *  - retryTimeout ( Time between retries 3000ms by default)
   *
   *
   * @param {Object} options
   */
  var Client = exports.TestAgent.WebsocketClient = function(options){
    var key;
    for(key in options){
      if(options.hasOwnProperty(key)){
        this[key] = options[key];
      }
    }
    Responder.call(this);

    this.on('close', this._incrementRetry.bind(this));
    this.on('message', this._processMessage.bind(this));
    this.on('open', this._clearRetries.bind(this));
  };

  Client.RetryError = function(){
    Error.apply(this, arguments);
  };

  Client.RetryError.prototype = Object.create(Error.prototype);

  Client.prototype = Object.create(Responder.prototype);
  Client.prototype.Native = Native;

  Client.prototype.proxyEvents = ['open', 'close', 'message'];

  //Retry
  Client.prototype.retry = false;
  Client.prototype.retries = 0;
  Client.prototype.retryLimit = Infinity;
  Client.prototype.retryTimeout = 3000;

  Client.prototype.start = function(){
    var i, event;

    if(this.retry && this.retries >= this.retryLimit){
      throw new Client.RetryError('Retry limit has been reach retried ' + String(this.retries) + ' times');
    }

    this.socket = new this.Native(this.url);

    for(i = 0; i < this.proxyEvents.length; i++){
      event = this.proxyEvents[i];
      this.socket.addEventListener(event, this._proxyEvent.bind(this, event));
    }

    this.emit('start', this);
  };

  /**
   * Sends Responder encoded event to the server.
   *
   * @param {String} event
   * @param {String} data
   */
  Client.prototype.send = function(event, data){
    this.socket.send(this.stringify(event, data));
  };

  Client.prototype._incrementRetry = function(){
    if(this.retry){
      this.retries++;
      setTimeout(this.start.bind(this), this.retryTimeout);
    }
  };

  Client.prototype._processMessage = function(message){
    if(message.data){
      message = message.data;
    }
    this.respond(message, this);
  };

  Client.prototype._clearRetries = function(){
    this.retries = 0;
  };

  Client.prototype._proxyEvent = function(){
    this.emit.apply(this, arguments);
  };

}(
  (typeof(window) === 'undefined')? module.exports : window
));
