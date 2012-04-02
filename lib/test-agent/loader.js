(function(window){

  'use strict';

  if(typeof(window.TestAgent) === 'undefined'){
    window.TestAgent = {};
  }

  var Loader = window.TestAgent.Loader = function(options){
    var key;
    if(typeof(options) === 'undefined'){
      options = {};
    }

    for(key in options){
      if(options.hasOwnProperty(key)){
        this[key] = options[key];
      }
    }
  };

  Loader.prototype = {

    prefix: '',
    bustCache: true,
    targetWindow: window,

    require: function(url){
      var prefix = this.prefix,
          suffix = '',
          element,
          document = this.targetWindow.document;

      if(this.bustCache){
        suffix = '?time=' + String(Date.now());
      }

      url = prefix + url + suffix;
      element = document.createElement('script');
      element.src = url;
      element.type = 'text/javascript';

      document.body.appendChild(element);
    }

  };

}(this));
