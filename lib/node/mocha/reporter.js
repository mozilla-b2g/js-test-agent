var Proxy = require('./runner-stream-proxy'),
    Runner = require('../../test-agent/responder').TestAgent.Responder;

/**
 * Accepts a reporter (like a Mocha reporter).
 * That will accept an object that responds to an .on method
 * and then emit events: start, end, suite, suite end, test, test end,
 * fail, pass, pending.
 *
 *
 * @param {Object} reporter
 * @constructor
 */
function Reporter(Report){
  this.runner = new Runner();
  this.proxy = new Proxy(this.runner);
  this.reporter = new Report(this.runner);
}

Reporter.prototype = {

  /**
   * Reponds to a an event in the form of a json string or an array.
   * This is passed through to the proxy which will format the results
   * and emit an event to the runner which will then comunicate to the
   * reporter.
   *
   * @param {Array | String} line
   */
  respond: function(line){
    return this.proxy.respond(line);
  }

};

module.exports = exports = Reporter;
