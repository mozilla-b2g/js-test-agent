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

  describe('on start', function() {
    beforeEach(function() {
      expect(subject.isRunning).to.be(false);
      subject.reporter.emit('start');
    });

    it('should be running', function() {
      expect(subject.isRunning).to.be(true);
    });

    describe('on end', function() {
      var firedEnd, calledWith;
      beforeEach(function() {
        calledWith = null;
        firedEnd = false;
        subject.savedError = 'foo';
        server.on('test runner end', function() {
          firedEnd = true;
          calledWith = arguments;
        });
        subject.reporter.emit('end', 'foo', 'bar');
      });

      it('should fire test runner end', function() {
        expect(firedEnd).to.be(true);
        expect(calledWith).to.eql(['foo', 'bar']);
      });

      it('should clear savedError', function() {
        expect(subject.savedError).to.be(undefined);
      });

      it('should not be running', function() {
        expect(subject.isRunning).to.be(false);
      });
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
      events.length = 0;

      subject.reporter.respond = function(line) {
        events.push(line);
      };
    });

    function hasTitle() {
      it('should have title', function() {
        expect(event.title).to.be(subject.syntaxErrorTitle);
      });

      it('should have fullTitle', function() {
        expect(event.fullTitle).to.be(subject.syntaxErrorTitle);
      });
    }

    function emitsSyntaxError() {

      describe('suite', function() {
        beforeEach(function() {
          event = events[0];
        });

        it('should be a suite', function() {
          expect(event[0]).to.be('suite');
        });
      });

      describe('test event', function() {
        beforeEach(function() {
          event = events[1][1];
        });

        it('should emit fail event', function() {
          expect(events[1][0]).to.be('test');
        });

        hasTitle();
      });

      describe('test failed event', function() {
        beforeEach(function() {
          event = events[2][1];
        });

        hasTitle();

        it('should emit fail event', function() {
          expect(events[2][0]).to.be('fail');
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
          event = events[3][1];
        });

        it('should emit fail event', function() {
          expect(events[3][0]).to.be('test end');
        });

        hasTitle();

        it('should be failed', function() {
          expect(event.state).to.be('failed');
        });
      });

      describe('suite end', function() {
        beforeEach(function() {
          event = events[4];
        });

        it('should be a suite', function() {
          expect(event[0]).to.be('suite end');
        });
      });
    }

    describe('when error occurs before start', function() {
      beforeEach(function() {
        server.emit('error', data);
        subject.reporter.emit('start');
      });

      emitsSyntaxError();
    });

    describe('when error occurs after start', function() {
      beforeEach(function() {
        subject.reporter.emit('start');
        server.emit('error', data);
      });

      emitsSyntaxError();
    });

  });

});
