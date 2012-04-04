(function(exports){
  if(typeof(exports.TestAgent) === 'undefined'){
    exports.TestAgent = {};
  }

  var WS = exports.TestAgent.WebSocketCommon = {

    IDENTIFIER: ':~:',

    /**
     * Stringifies request to websocket
     *
     *
     * @param {String} command command name
     * @param {Object} data object to be sent over the wire
     * @return {String} json object
     */
    stringify: function(command, data){
      return command + this.IDENTIFIER + JSON.stringify(data);
    },

    /**
     * Parses request from WebSocket.
     *
     * @param {String} json json string to translate
     * @return {Object} object where .data is json data and .command is command name.
     */
    parse: function(json){
      var cmd,
          data,
          index = json.search(this.IDENTIFIER),
          cmd = json.slice(0, index);

      data = JSON.parse(json.slice(index + this.IDENTIFIER.length));

      return {command: cmd, data: data};
    }

  };

  //Message Responder
  
  /**
   * Constructor
   *
   * @param {Object} list of events to add onto responder
   */
  WS.Responder = function(events){
    var event;

    this.events = {};

    for(event in events){
      if(events.hasOwnProperty(event)){
        this.addEventListener(event, events[event]);
      }
    }
  };

  WS.Responder.prototype = {

    /**
     * Events on this instance
     *
     * @property events
     * @type Object
     */
    events: null,

    /**
     * Recieves json string event and dispatches an event.
     *
     * @param {String} json
     * @param {Object} params... option number of params to pass to emit
     * @return {Object} result of WebSocketCommon.parse
     */
    respond: function(json){
      var event = WS.parse(json),
          args = Array.prototype.slice.call(arguments).slice(1);

      args.unshift(event.data);
      args.unshift(event.command);

      this.emit.apply(this, args);

      return event;
    },

    //TODO: Extract event emitter logic

    /**
     * Adds an event listener to this object.
     *
     *
     * @param {String} type event name
     * @param {String} callback
     */
    addEventListener: function(type, callback){
      if(!(type in this.events)){
        this.events[type] = [];
      }

      this.events[type].push(callback);

      return this;
    },

    /**
     * Emits an event.
     *
     * Accepts any number of additional arguments to pass unto
     * event listener.
     *
     * @param {String} eventName
     * @param {Arg...}
     */
    emit: function(){
      var args = Array.prototype.slice.call(arguments),
          event = args.shift(),
          eventList,
          self = this;

      if(event in this.events){
        eventList = this.events[event];

        eventList.forEach(function(callback){
          callback.apply(self, args);
        });
      }

      return this;
    },

    /**
     * Removes all event listeners for a given event type
     *
     *
     * @param {String} event
     */
    removeAllEventListeners: function(name){
      if(name in this.events){
        //reuse array
        this.events[name].length = 0;
      }

      return this;
    },

    /**
     * Removes a single event listener from a given event type
     * and callback function.
     *
     *
     * @param {String} eventName event name
     * @param {Function} callback
     */
    removeEventListener: function(name, callback){
      var i, length, events;

      if(!(name in this.events)){
        return false;
      }

      events = this.events[name];

      for(i = 0, length = events.length; i < length; i++){
        if(events[i] && events[i] === callback){
          events.splice(i, 1);
          return true;
        }
      }

      return false;
    }

  };

  WS.Responder.prototype.on = WS.Responder.prototype.addEventListener;

}(
  (typeof(window) === 'undefined')? module.exports : window
));
