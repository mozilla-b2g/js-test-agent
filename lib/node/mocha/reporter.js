var Proxy = require('./runner-stream-proxy'),
    Responder = require('../../test-agent/responder').TestAgent.Responder,
    ConcurrentReportingEvents = require('./concurrent-reporting-events');

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

  this.envs = [];
  if (!this.reporterClass) {
    this.reporterClass = require('mocha').reporters[this.defaultMochaReporter];
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
  this.runner = new ConcurrentReportingEvents({
    envs: this.envs
  });

  this.reporter = new this.reporterClass(this.runner);
  this.proxy = new Proxy(this.runner);
  this.envs = [];

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
 * and emit an event to the runner which will then comunicate to the
 * reporter.
 *
 * Creates reporter, proxy and runner when recieving the start event.
 *
 * @param {Array | String} line event line.
 * @return {Object} proxy object.
 */
Reporter.prototype.respond = function respond(line) {
  var data = Responder.parse(line);
  if (data.event === 'start' && !this.reporter) {
    this.createRunner();
    this.emit('start', this);
  }
  return this.proxy.respond([data.event, data.data]);
};

/** exports */
module.exports = exports = Reporter;
