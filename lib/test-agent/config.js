(function(window){

  'use strict';

  if(typeof(window.TestAgent) === 'undefined'){
    window.TestAgent = {};
  }

  var Server = window.TestAgent.Config = function(options){
    var key;

    for(key in options){
       if(options.hasOwnProperty(key)){
        this[key] = options[key];
       }
    }
  };

  Server.prototype = {
    /**
     * URL to the json fiel which contains
     * a list of files to load.
     *
     *
     * @property url
     * @type String
     */
    url: '',

    /**
     * Ready is true when resources have been loaded
     *
     *
     * @type Boolean
     * @property ready
     */
    ready: false,

    /**
     * List of test resources.
     *
     * @property resources
     * @type Array
     */
    resources: [],

    /**
     * Parse XHR response
     *
     * @param Object xhr xhr object
     */
    _parseResponse: function(xhr){
      var response;

      if(xhr.responseText){
        response = JSON.parse(xhr.responseText);
        //only return files for now...
        return response;
      }

      return {
        tests: []
      };
    },

    /**
     * Loads list of files from url
     *
     */
    load: function(callback){
      var xhr = new XMLHttpRequest(),
          self = this,
          response;

      xhr.open('GET', this.url, true);
      xhr.onreadystatechange = function(){
        if(xhr.readyState === 4){
          if(xhr.status === 200 || xhr.status === 0){
            response = self._parseResponse(xhr);

            self.ready = true;
            self.resources = response.tests;

            callback.call(this, response);
          } else {
            throw new Error('Could not fetch tests from "' + self.url  + '"');
          }
        } else {
        }
      };

      xhr.send(null);
    }
  };

  //backwards compat
  Server.prototype._loadResource = Server.prototype.load;

}(this));

