describe('node/mocha/reporter', function() {

  var Responder,
      Reporter,
      Handler,
      Proxy,
      subject,
      report,
      Mocha,
      mochaReporter;

  cross.require(
    'test-agent/responder',
    'TestAgent.Responder', function(obj) {
      Responder = obj;
    }
  );

  cross.require(
    'test-agent/mocha/runner-stream-proxy',
    'TestAgent.Mocha.RunnerStreamProxy', function(obj) {
      Proxy = obj;
    }
  );

  cross.require(
    'test-agent/mocha/concurrent-reporting-events',
    'TestAgent.Mocha.ConcurrentReportingEvents', function(obj) {
      Handler = obj;
    }
  );

  cross.require(
    'test-agent/mocha/reporter',
    'TestAgent.Mocha.Reporter', function(obj) {
      Reporter = obj;
    }
  );

  beforeEach(function() {
    if (typeof(window) === 'undefined') {
      Mocha = require('mocha');
    } else {
      Mocha = mocha;
    }
    report = Responder;
    subject = new Reporter({
      reporterClass: function(runner) {
        this.runner = runner;
      }
    });
    mochaReporter = Mocha.reporters[subject.defaultMochaReporter];
  });

  it('should use .Spec as default reporter', function() {
    expect(subject.defaultMochaReporter).to.be('Spec');
  });

  it('should be an instance of Responder', function() {
    expect(subject).to.be.a(Responder);
  });

  describe('initialization', function() {
    beforeEach(function() {
      subject = new Reporter();
    });

    it('should not have a .proxy', function() {
      expect(subject.proxy).not.to.be.ok();
    });

    describe('without a reporter', function() {
      it('should use the default (Spec)', function() {
        expect(subject.reporterClass).to.be(mochaReporter);
      });
    });

    describe('with a reporter', function() {

      beforeEach(function() {
        subject = new Reporter({
          reporterClass: mochaReporter
        });
      });

      it('should use given reporter', function() {
        expect(subject.reporterClass).to.be(mochaReporter);
      });
    });

  });

  describe('.setEnvs', function() {
    it('should set envs and expand strings', function() {
      subject.setEnvs(['two', 'three']);
      expect(subject.envs).to.eql(['two', 'three']);
      subject.setEnvs('one');
      expect(subject.envs).to.eql(['one']);
    });
  });

  describe('.getMochaReporter', function() {
    it('should return reporter', function() {
      subject.createRunner();
      subject.runner.emitStart();
      expect(subject.getMochaReporter()).to.be.a(subject.reporterClass);
    });
  });

  describe('.createRunner', function() {
    beforeEach(function() {
      subject.setEnvs('current');
      subject.createRunner();
      subject.setEnvs('next');
    });

    it('should create .runner', function() {
      expect(subject.runner).to.be.a(Handler);
    });

    it('should clear envs', function() {
      expect(subject.envs).to.eql(['next']);
    });

    it('should pass current env to runner', function() {
      expect(subject.runner.envs).to.eql(['current']);
    });

    it('should create the proxy', function() {
      expect(subject.proxy).to.be.a(Responder);
      expect(subject.proxy.runner).to.be(subject.runner);
    });

    it('should have no .repoter until emit start', function() {
      expect(subject.repoter).not.to.be.ok();
    });

    it('should create the .reporter', function() {
      subject.runner.emitStart();
      expect(subject.reporter).to.be.a(subject.reporterClass);
      expect(subject.reporter.runner).to.be(subject.runner);
    });
  });

  describe('.respond', function() {

    var calledWith = [],
        sentWith,
        origRespond,
        sentStartEvent = false,
        endData = ['end', {}],
        startData = ['start', {total: 20}];

    before(function() {
      origRespond = Proxy.prototype.respond;
    })

    afterEach(function() {
      Proxy.prototype.respond = origRespond;
    });

    beforeEach(function() {
      var respond;
      sentWith = null;
      calledWith = [];
      Proxy.prototype.respond = function() {
        calledWith.push(Array.prototype.slice.call(arguments));
        origRespond.apply(this, arguments);
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
        subject.reporterClass = function(){};

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

      it('should create reporter', function() {
        expect(subject.reporter).to.be.ok();
      });

      it('should call proxy', function() {
        subject.respond(startData);

        expect(calledWith[0][0]).to.eql(startData);
      });

      describe('when runner end event is sent', function() {
        beforeEach(function() {
          subject.runner.emit('end');
        });

        it('should clear previous runner, reporter and proxy', function() {
          expect(subject.reporter).not.to.be.ok();
          expect(subject.runner).not.to.be.ok();
          expect(subject.proxy).not.to.be.ok();
        });
      });

    });
  });

});

