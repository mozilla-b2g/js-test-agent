(function(window) {

  'use strict';

  if (typeof(window.TestAgent) === 'undefined') {
    window.TestAgent = {};
  }

  var Loader = window.TestAgent.Loader = function Loader(options) {
    var key;

    this._cached = {};
    this.doneCallbacks = [];
    this.pending = 0;

    if (typeof(options) === 'undefined') {
      options = {};
    }

    for (key in options) {
      if (options.hasOwnProperty(key)) {
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

    get targetWindow() {
      return this._targetWindow;
    },

    set targetWindow(value) {
      this._targetWindow = value;
      this._cached = {};
    },

    /**
     * _decrements pending and fires done callbacks
     */
    _decrementPending: function _decrementPending() {
      if (this.pending > 0) {
        this.pending--;
      }

      if (this.pending <= 0) {
        this._fireCallbacks();
      }
    },

    _fireCallbacks: function _fireCallbacks() {
      var callback;
      while ((callback = this.doneCallbacks.shift())) {
        callback();
      }
    },

    /**
     * Adds a done callback
     *
     *
     * @param {Function} callback
     */
    done: function done(callback) {
      this.doneCallbacks.push(callback);
      return this;
    },

    /**
     * Loads given script into current target window.
     * If file has been previously loaded it will not
     * be loaded again.
     *
     * @param {String} url
     * @param {String} callback
     */
    require: function require(url, callback) {
      var prefix = this.prefix,
          suffix = '',
          self = this,
          element,
          document = this.targetWindow.document;

      if (url in this._cached) {
        //url is cached we are good
        return;
      }

      if (this.bustCache) {
        suffix = '?time=' + String(Date.now()) + '&rand=' + String(Math.random() * 1000);
      }

      this._cached[url] = true;

      var args = arguments;

      url = prefix + url + suffix;
      element = document.createElement('script');
      element.src = url;
      element.async = false;
      element.type = 'text/javascript';
      element.onload = function scriptOnLoad() {
        if (callback) {
          callback();
        }
        self._decrementPending();
      };

      this.pending++;

      document.getElementsByTagName('head')[0].appendChild(element);
    }

  };

}(this));
