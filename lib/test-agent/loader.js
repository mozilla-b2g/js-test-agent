(function(window){

  'use strict';

  if(typeof(window.TestAgent) === 'undefined'){
    window.TestAgent = {};
  }

  var Loader = window.TestAgent.Loader = function(options){
    var key;

    this._cached = {};

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

    /**
     * Prefix for all loaded files
     *
     * @type String
     * @property prefix
     */
    prefix: '',

    /**
     * When true will add timestamps to required urls via query param
     *
     * @type Boolean
     * @property bustCache
     */
    bustCache: true,

    /**
     * Current window in which required files will be injected.
     *
     * @private
     * @property targetWindow
     * @type Window
     */
    _targetWindow: window,

    /**
     * Cached urls
     *
     * @property _cached
     * @type Object
     * @private
     */
    _cached: null,

    get targetWindow(){
      return this._targetWindow;
    },

    set targetWindow(value){
      this._targetWindow = value;
      this._cached = {};
    },

    /**
     * Loads given script into current target window.
     * If file has been previously required it will not
     * be loaded again.
     *
     *
     * @param {String} url
     */
    require: function(url){
      var prefix = this.prefix,
          suffix = '',
          element,
          document = this.targetWindow.document;

      if(url in this._cached){
        //url is cached we are good
        return;
      }

      if(this.bustCache){
        suffix = '?time=' + String(Date.now()) + '&rand=' + String(Math.random() * 1000);
      }

      this._cached[url] = true;

      url = prefix + url + suffix;
      element = document.createElement('script');
      element.src = url;
      element.type = 'text/javascript';

      document.body.appendChild(element);
    }

  };

}(this));
