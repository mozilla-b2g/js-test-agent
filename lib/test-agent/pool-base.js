(function(exports){
  if(typeof(exports.TestAgent) === 'undefined'){
    exports.TestAgent = {};
  }

  var Pool = exports.TestAgent.PoolBase = function(){
    this._items = {};
  };

  Pool.prototype = {

    add: function(object){
      var details = this.objectDetails(object);
      this._items[details.key] = details.value;
    },

    remove: function(object){
      var details = this.objectDetails(object);
      delete this._items[details.key];
    },

    has: function(object){
      var details = this.objectDetails(object);
      return !!(details.key && (details.key in this._items));
    },

    checkObjectValue: function(object){
      return true;
    },

    objectDetails: function(object){
      return object;
    },

    /**
     * Executes a function for each element
     * in the collection if checkObjectValue returns
     * false for a given element the function will *NOT*
     * be called.
     *
     * @param {Function} callback
     */
    each: function(callback){
      var key, value;

      for(key in this._items){
        if(this._items.hasOwnProperty(key)){
          value = this._items[key];

          if(this.checkObjectValue(value)){
            callback(value, key);
          }
        }
      }
    }
  };

}(
  (typeof(window) === 'undefined')? module.exports : window
));


