var Mocha = require_lib('node/server/mocha-test-events'),
    AppResponder = require_lib('node/server/responder'),
    Reporter = require_lib('node/mocha/reporter'),
    Responder = require_lib('test-agent/responder'),
    //does nothing
    MochaReporter = function(){};

describe("node/server/mocha-test-events", function(){

  var server,
      subject,
      factory = require('../factory/websocket-server');

  beforeEach(function(){
    subject = new Mocha({
      reporterClass: MochaReporter
    });

    server = factory.websocketServer();

    subject.enhance(server);
    (new AppResponder()).enhance(server);
  });

  describe("initialization", function(){

    it("should have a reporter", function(){
      expect(subject.reporter).to.be.ok();
    });

    it("should pass through options to the Reporter", function(){
      expect(subject.reporter.reporterClass).to.be(MochaReporter);
    });
  });

  describe("on test data", function(){
    var data, socket, startCalledWith;

    beforeEach(function(){
      expect(subject.reporter.proxy).not.to.be.ok();

      server.on('test runner', function(runner){
        startCalledWith = runner;
      });

      data = ['start', {total: 20}];
      server.emit('test data', data);
    });

    it("should bubble up start evet on runner to test runner event on server", function(){
      expect(startCalledWith).to.be(subject.reporter);
    });

    it("should start proxy on runner", function(){
      expect(subject.reporter.proxy).to.be.ok();
    });

  });
});
