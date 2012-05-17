(function() {

  var isNode = typeof(window) === 'undefined',
      Responder,
      Proxy,
      ReportingEvents,
      Mocha;

  if (!isNode) {
    if (typeof(TestAgent.Mocha) === 'undefined') {
      TestAgent.Mocha = {};
    }

    Responder = TestAgent.Responder;
    Proxy = TestAgent.Mocha.RunnerStreamProxy;
    ReportingEvents = TestAgent.Mocha.ConcurrentReportingEvents;
  } else {
    Responder = require('../responder');
    Proxy = require('./runner-stream-proxy');
    ReportingEvents = require('./concurrent-reporting-events');
  }

  /**
   * @param {Object} options configuration options.
   * @constructor
   */
  function Reporter(options) {
    var key;

    Responder.call(this);

    for (key in options) {
      if (options.hasOwnProperty(key)) {
        this[key] = options[key];
      }
    }

    if (isNode) {
      Mocha = require('mocha');
    } else {
      Mocha = window.mocha;
    }

    this.envs = [];
    if (!this.reporterClass) {
      this.reporterClass = Mocha.reporters[this.defaultMochaReporter];
    }
  }

  Reporter.prototype = Object.create(Responder.prototype);

  /**
   * Adds env to next test run.
   *
   * @param {String|String[]} env a single env or an array of envs.
   */
  Reporter.prototype.addEnv = function addEnv(env) {
    if (env instanceof Array) {
      this.envs = this.envs.concat(env);
    } else {
      this.envs.push(env);
    }
  };

  /**
   * Default mocha reporter defaults to 'Spec'
   *
   * @type String
   */
  Reporter.prototype.defaultMochaReporter = 'Spec';

  /**
   * Creates a runner instance.
   */
  Reporter.prototype.createRunner = function createRunner() {
    var self = this;
    this.runner = new ReportingEvents({
      envs: this.envs
    });

    this.proxy = new Proxy(this.runner);
    this.envs = [];

    this.runner.once('start', function() {
      self.emit('start', self);
      self.reporter = new self.reporterClass(self.runner);
      self.runner.emitStart();
    });

    this.runner.on('end', function() {
      self.emit('end', self);
      self.runner = null;
      self.reporter = null;
      self.proxy = null;
    });
  };


  /**
   * Returns the mocha reporter used in the proxy.
   *
   *
   * @return {Object} mocha reporter.
   */
  Reporter.prototype.getMochaReporter = function getMochaReporter() {
    return this.reporter;
  };

  /**
   * Reponds to a an event in the form of a json string or an array.
   * This is passed through to the proxy which will format the results
   * and emit an event to the runner which will then communicate to the
   * reporter.
   *
   * Creates reporter, proxy and runner when receiving the start event.
   *
   * @param {Array | String} line event line.
   * @return {Object} proxy object.
   */
  Reporter.prototype.respond = function respond(line) {
    var data = Responder.parse(line);
    if (data.event === 'start' && !this.proxy) {
      this.createRunner();
    }
    return this.proxy.respond([data.event, data.data]);
  };

  if (isNode) {
    module.exports = Reporter;
  } else {
    TestAgent.Mocha.Reporter = Reporter;
  }

}());
