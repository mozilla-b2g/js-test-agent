var Proxy = require('./runner-stream-proxy'),
    Runner = require('../../test-agent/responder').TestAgent.Responder;

/**
 * @param {Object} options
 * @constructor
 */
function Reporter(options){
  var key;
  for(key in options){
    if(options.hasOwnProperty(key)){
      this[key] = options[key];
    }
  }

  if(!this.reporterClass){
    this.reporterClass = require('mocha').reporters[this.defaultMochaReporter];
  }
}

Reporter.prototype = {

  defaultMochaReporter: 'Spec',

  createRunner: function(){
    this.runner = new Runner();
    this.reporter = new this.reporterClass(this.runner);
    this.proxy = new Proxy(this.runner);
  },

  /**
   * Reponds to a an event in the form of a json string or an array.
   * This is passed through to the proxy which will format the results
   * and emit an event to the runner which will then comunicate to the
   * reporter.
   *
   * @param {Array | String} line
   */
  respond: function(line){
    var data = Runner.parse(line);
    if(data.event === 'start'){
      this.createRunner();
    }
    return this.proxy.respond([data.event, data.data]);
  }

};

module.exports = exports = Reporter;
