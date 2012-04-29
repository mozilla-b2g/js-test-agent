var Responder = require_lib('test-agent/responder').TestAgent.Responder,
    Reporter = require_lib('node/mocha/reporter'),
    Proxy = require_lib('node/mocha/runner-stream-proxy');

describe('node/mocha/reporter', function() {

  var subject,
      report,
      mochaReporter;

  beforeEach(function() {
    report = Responder;
    subject = new Reporter();
    mochaReporter = require('mocha').reporters[subject.defaultMochaReporter];
  });

  it('should use .Spec as default reporter', function() {
    expect(subject.defaultMochaReporter).to.be('Spec');
  });

  it('should be an instance of Responder', function() {
    expect(subject).to.be.a(Responder);
  });

  describe('initialization', function() {

    it('should not have a .proxy', function() {
      expect(subject.proxy).not.to.be.ok();
    });

    describe('without a reporter', function() {
      it('should use the default (Spec)', function() {
        expect(subject.reporterClass).to.be(mochaReporter);
      });
    });

    describe('with a reporter', function() {
      var reporterClass = require('mocha').reporters.List;

      beforeEach(function() {
        subject = new Reporter({
          reporterClass: reporterClass
        });
      });

      it('should use given reporter', function() {
        expect(subject.reporterClass).to.be(reporterClass);
      });

    });
  });

  describe('.createRunner', function() {
    beforeEach(function() {
      subject.createRunner();
    });

    it('should create .runner', function() {
      expect(subject.runner).to.be.a(Responder);
    });

    it('should create the proxy', function() {
      expect(subject.proxy).to.be.a(Responder);
      expect(subject.proxy.runner).to.be(subject.runner);
    });

    it('should create the .reporter', function() {
      expect(subject.reporter).to.be.a(mochaReporter);
      expect(subject.reporter.runner).to.be(subject.runner);
    });
  });

  describe('.respond', function() {

    var calledWith = [],
        sentWith,
        respond = Proxy.prototype.respond,
        sentStartEvent = false,
        endData = ['end', {}],
        startData = ['start', {total: 20}];

    afterEach(function() {
      Proxy.prototype.respond = respond;
    });

    beforeEach(function() {
      var respond;
      sentWith = null;
      calledWith = [];
      respond = Proxy.prototype.respond;
      Proxy.prototype.respond = function() {
        calledWith.push(Array.prototype.slice.call(arguments));
        respond.apply(this, arguments);
      };
    });

    describe('when end event is responded to', function() {

      it('should emit end event', function(done) {
        subject.on('end', function() {
          done();
        });

        subject.respond(startData);
        subject.respond(endData);
      });

    });

    describe('when start event is responded to', function() {


      function sendStart() {
        subject.respond(startData);
      }

      function sendsStartEvent() {
        it('should send start event', function() {
          expect(sentWith).to.be(subject);
          expect(sentStartEvent).to.be(true);
        });
      }

      beforeEach(function() {
        sentStartEvent = false;

        subject.on('start', function(runner) {
          sentStartEvent = true;
          sentWith = runner;
        });

        sendStart();
      });

      sendsStartEvent();

      it('should create proxy', function() {
        expect(subject.proxy).to.be.ok();
      });

      it('should call proxy', function() {
        subject.respond(startData);

        expect(calledWith[0][0]).to.eql(startData);
      });

      describe('the second time start is sent', function() {
        var originalProxy;
        beforeEach(function() {
          originalProxy = subject.proxy;
          sendStart();
        });

        sendsStartEvent();

        it('should create a new proxy', function() {
          expect(subject.proxy).not.to.be(originalProxy);
        });

      });

    });
  });

});
