(function(exports){
  if(typeof(exports.TestAgent) === 'undefined'){
    exports.TestAgent = {};
  }

  var WS = exports.TestAgent.WebSocketCommon = {

    IDENTIFIER: ' : ',

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
  WS.Responder = function(){};
  WS.Responder.prototype = {

    /**
     *
     *
     *
     */
    events: {},

    /**
     * Recieves json string event and dispatches an event.
     *
     * @param {String} json
     */
    receive: function(json){
    },

    addEventListener: function(type, callback){

    },

    on: WS.Responder.addEventListener,

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

    },

    removeAllEventListeners: function(name){

    },

    removeEventListener: function(name, callback){

    }

  };

}(
  (typeof(window) === 'undefined')? module.exports : window
));
