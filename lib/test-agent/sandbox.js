(function(window) {

  'use strict';

  if (typeof(window.TestAgent) === 'undefined') {
    window.TestAgent = {};
  }

  var Sandbox = window.TestAgent.Sandbox = function Sandbox(url) {
    this.url = url;
  };

  Sandbox.prototype = {

    _element: null,

    /**
     * @type Boolean
     *
     * True when sandbox is ready
     */
    ready: false,

    /**
     * URL for the iframe sandbox.
     *
     * @type String
     */
    url: null,

    /**
     * Returns iframe element.
     *
     *
     * @type DOMElement
     */
    getElement: function getElement() {
      var iframe;
      if (!this._element) {
        iframe = this._element = window.document.createElement('iframe');
        iframe.src = this.url + '?time=' + String(Date.now());
      }
      return this._element;
    },

    run: function run(callback) {
      //cleanup old sandboxes
      this.destroy();

      var element = this.getElement(),
          self = this;

      //this must come before the listener
      window.document.body.appendChild(element);
      element.contentWindow.addEventListener('DOMContentLoaded', function() {
        self.ready = true;
        callback.call(this);
      });
    },

    destroy: function destroy() {
      var el;

      if (!this.ready) {
        return false;
      }


      this.ready = false;

      el = this.getElement();
      el.parentNode.removeChild(el);


      return true;
    },

    getWindow: function getWindow() {
      if (!this.ready) {
        return false;
      }

      return this.getElement().contentWindow;
    }

  };

}(this));
