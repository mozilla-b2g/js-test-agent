var Mocha = require_lib('node/server/mocha-test-events'),
    AppResponder = require_lib('node/server/responder'),
    Reporter = require_lib('node/mocha/reporter'),
    Responder = require_lib('test-agent/responder'),
    //does nothing
    MochaReporter = function() {};

describe('node/server/mocha-test-events', function() {

  var server,
      subject,
      factory = require('../factory/websocket-server');

  beforeEach(function() {
    subject = new Mocha({
      reporterClass: MochaReporter
    });

    server = factory.websocketServer();

    subject.enhance(server);
    (new AppResponder()).enhance(server);
  });

  describe('initialization', function() {

    it('should have a reporter', function() {
      expect(subject.reporter).to.be.ok();
    });

    it('should pass through options to the Reporter', function() {
      expect(subject.reporter.reporterClass).to.be(MochaReporter);
    });
  });

  describe('on test data', function() {
    var data, socket, startCalledWith;

    beforeEach(function() {
      expect(subject.reporter.proxy).not.to.be.ok();

      server.on('test runner', function(runner) {
        startCalledWith = runner;
      });

      data = ['start', {total: 20}];
      server.emit('test data', data);
    });

    it('should bubble up start event on runner', function() {
      expect(startCalledWith).to.be(subject.reporter);
    });

    it('should start proxy on runner', function() {
      expect(subject.reporter.proxy).to.be.ok();
    });
  });

  describe('on error event', function() {
    var data,
        event,
        events = [];

    data = {
      filename: 'file.js',
      lineno: 20,
      message: 'critical err'
    };

    beforeEach(function() {
      data.length = 0;
      server.emit('error', data);

      subject.reporter.respond = function(line) {
        events.push(line);
      };

      subject.reporter.emit('start');
    });

    function hasTitle() {
      it('should have title', function() {
        expect(event.title).to.be(subject.syntaxErrorTitle);
      });

      it('should have fullTitle', function() {
        expect(event.fullTitle).to.be(subject.syntaxErrorTitle);
      });
    }

    describe('test event', function() {
      beforeEach(function() {
        event = events[0][1];
      });

      it('should emit fail event', function() {
        expect(events[0][0]).to.be('test');
      });

      hasTitle();
    });

    describe('test failed event', function() {
      beforeEach(function() {
        event = events[1][1];
      });

      hasTitle();

      it('should emit fail event', function() {
        expect(events[1][0]).to.be('fail');
      });

      it('should be failed', function() {
        expect(event.state).to.be('failed');
      });

      it('should have err.message', function() {
        var err = event.err;
        expect(err.message).to.contain(data.filename);
        expect(err.message).to.contain(data.message);
        expect(err.message).to.contain(data.lineno);
      });

      it('should have err.stack', function() {
        var err = event.err;
        expect(err.stack).to.contain(data.filename);
        expect(err.stack).to.contain(data.message);
        expect(err.stack).to.contain(data.lineno);
      });

    });

    describe('test end event', function() {
      beforeEach(function() {
        event = events[2][1];
      });

      it('should emit fail event', function() {
        expect(events[2][0]).to.be('test end');
      });

      hasTitle();

      it('should be failed', function() {
        expect(event.state).to.be('failed');
      });
    });

  });

});
