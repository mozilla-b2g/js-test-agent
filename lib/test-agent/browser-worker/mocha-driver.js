(function(window) {
  'use strict';

  function MochaDriver(options) {
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

  MochaDriver.createMutliReporter = function createMultiReporter() {
    var reporters = Array.prototype.slice.call(arguments);

    return function(runner) {
      reporters.forEach(function(Report) {
        new Report(runner);
      });
    };
  };

  MochaDriver.prototype = {
    /**
     * Test interface for mocha use.
     */
    ui: 'bdd',

    /**
     * Mocha reporter to use.
     * If null is given none will be used.
     */
    reporter: 'HTML',

    /**
     * location of test helper(s).
     *
     * Will be loaded before any of your tests.
     * May pass more then one via an array.
     *
     * Each helper is loaded completely before
     * requiring any other helpers allowing multiple
     * files to be requested prior to executing tests.
     *
     * @type {String|Array}
     */
    testHelperUrl: './test/helper.js',

    /**
     * Location of the mocha runtime.
     */
    mochaUrl: './vendor/mocha/mocha.js',

    enhance: function enhance(worker) {
      this.worker = worker;
      worker.testRunner = this._testRunner.bind(this);
    },

    getReporter: function getReporter(box) {
      var stream = TestAgent.Mocha.JsonStreamReporter,
          self = this;

      stream.console = box.console;

      stream.send = function send(line) {
        self.worker.send('test data', line);
      };

      if (this.worker.env) {
        TestAgent.Mocha.JsonStreamReporter.testAgentEnvId = this.worker.env;
      }


      if(this.reporter) {
        return MochaDriver.createMutliReporter(
          TestAgent.Mocha.JsonStreamReporter,
          box.Mocha.reporters[this.reporter]
        );
      } else {
        return TestAgent.Mocha.JsonStreamReporter;
      }

      return result;
    },

    _loadTestHelpers: function(box, callback) {
      var helpers = this.testHelperUrl;
      if (typeof(helpers) === 'string') {
        helpers = [helpers];
      }

      var current = 0;
      var max = helpers.length;

      function next() {
        if (current < max) {
          box.require(helpers[current], function() {
            current++;
            next();
          });
        } else {
          callback();
        }
      }

      next();
    },

    _testRunner: function _testRunner(worker, tests, done) {
      var box = worker.sandbox.getWindow(),
          self = this;

      worker.loader.done(function onDone() {
        box.mocha.run(done);
      });

      box.require(this.mochaUrl, function onRequireMocha() {
        if (!box.process) {
          box.process = {
            stdout: {
              write: console.log
            },
            write: console.log
          };
        }

        // due to a bug in mocha, iframes added to the DOM are
        // detected as global leaks in FF 21+, these global ignores
        // are a workaround. see also:
        // https://developer.mozilla.org/en-US/docs/Site_Compatibility_for_Firefox_21
        var globalIgnores = ['0', '1', '2', '3', '4', '5'];

        //setup mocha
        box.mocha.setup({
          globals: globalIgnores,
          ui: self.ui,
          reporter: self.getReporter(box)
        });
      });

      self._loadTestHelpers(box, function() {
        tests.sort().forEach(function(test) {
          box.require(test);
        });
      });
    }

  };

  window.TestAgent.BrowserWorker.MochaDriver = MochaDriver;

}(this));
