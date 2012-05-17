describe('mocha/common/mocha-test-events', function() {

  var server,
      subject,
      worker,
      Mocha,
      Reporter,
      Responder,
      MochaReporter = function() {};


  cross.require(
    'test-agent/responder',
    'TestAgent.Responder',
    function(o) {
      Responder = o;
    }
  );

  cross.require(
    'test-agent/mocha/runner-stream-proxy',
    'TestAgent.Mocha.RunnerStreamProxy',
    function() {}
  );

  cross.require(
    'test-agent/mocha/concurrent-reporting-events',
    'TestAgent.Mocha.ConcurrentReportingEvents',
    function() {}
  );

  cross.require(
    'test-agent/mocha/reporter',
    'TestAgent.Mocha.Reporter',
    function(o) {
      Reporter = o;
    }
  );

  cross.require(
    'test-agent/common/mocha-test-events',
    'TestAgent.Common.MochaTestEvents',
    function(o) {
      Mocha = o;
    }
  );


  beforeEach(function() {
    subject = new Mocha({
      reporterClass: MochaReporter,
      mochaSelector: '#test-mocha'
    });

    server = new Responder();

    subject.enhance(server);
  });

  describe('initialization', function() {

    it('should have a reporter', function() {
      expect(subject.reporter).to.be.ok();
    });

    it('should set mochaSelector', function() {
      expect(subject.mochaSelector).to.be('#test-mocha');
    });

    it('should pass through options to the Reporter', function() {
      expect(subject.reporter.reporterClass).to.be(MochaReporter);
    });
  });

  describe('event: set test envs', function() {

    beforeEach(function() {
      server.emit('set test envs', ['one']);
      server.emit('set test envs', ['two']);
    });

    it('should set env on reporter', function() {
      expect(subject.reporter.envs).to.eql(['two']);
    });
  });

  if (typeof(window) !== 'undefined') {
    describe('clearing out previous mocha element', function() {
      var el;

      beforeEach(function() {
        el = document.createElement('div');
        el.id = 'test-mocha';
        el.innerHTML = 'fooz';
        document.body.appendChild(el);

        subject.reporter.emit('start');
      });

      it('should clear out mocha element', function() {
        expect(el.innerHTML).to.eql('');
      });

    });
  }

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

});

