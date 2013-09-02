(function(window) {
  'use strict';

  function BlanketDriver(options) {
    var key;

    if (typeof(options) === 'undefined') {
      options = {};
    }

    for (key in options) {
      if (options.hasOwnProperty(key)) {
        this[key] = options[key];
      }
    }
  }

  BlanketDriver.prototype = {
    /**
     * Location of the blanket runtime.
     */
    blanketUrl: './vendor/blanket/blanket.js',

    /**
     * Location of config for blanket.
     */
    configUrl: '/test/unit/blanket_config.json',

    /**
     * Default config when config file not found.
     */
    _defaultConfig: {
      'data-cover-only': 'js/'
    },

    enhance: function enhance(worker) {
      var self = this;
      this.worker = worker;
      worker.coverageRunner = this._coverageRunner.bind(this);
      this.load(function(data) {
        self.blanketConfig = data;
      });
    },

    _coverageRunner: function _coverageRunner(worker) {
      var box = worker.sandbox.getWindow();
      box.require(this.blanketUrl, null, this.blanketConfig);
    },

    /**
     * Parse XHR response
     *
     * @param {Object} xhr xhr object.
     */
    _parseResponse: function _parseResponse(xhr) {
      var response;

      if (xhr.responseText) {
        response = JSON.parse(xhr.responseText);
        //only return files for now...
        return response;
      }

      return this._defaultConfig;
    },

    /**
     * Loads list of files from url
     */
    load: function load(callback) {
      var xhr = new XMLHttpRequest(),
          self = this,
          response;

      xhr.open('GET', this.configUrl, true);
      xhr.onload = function onload() {
        if (xhr.status === 200 || xhr.status === 0) {
          response = self._parseResponse(xhr);
        } else {
          response = self._defaultConfig;
        }

        callback.call(this, response);
      };

      xhr.send(null);
    }
  };

  window.TestAgent.BrowserWorker.BlanketDriver = BlanketDriver;

}(this));
