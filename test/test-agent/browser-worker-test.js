require_lib('test-agent/responder.js');
require_lib('test-agent/loader.js');
require_lib('test-agent/sandbox.js');
require_lib('test-agent/websocket-client.js');
require_lib('test-agent/browser-worker.js');

describe('test-agent/browser-worker', function() {

  var subject, fn = function() {};

  beforeEach(function() {
    subject = new TestAgent.BrowserWorker({
      sandbox: '/test/fixtures/iframe.html',
      testRunner: fn
    });
  });

  afterEach(function() {
    subject.sandbox.destroy();
  });

  describe('.deps', function() {
    var deps;
    beforeEach(function() {
      deps = TestAgent.BrowserWorker.prototype.deps;
    });

    it('should have Sandbox set to TestAgent.Sanbox', function() {
      expect(deps.Sanbox).to.be(TestAgent.Sanbox);
    });

    it('should have Loader set to TestAgent.Loader', function() {
      expect(deps.Loader).to.be(TestAgent.Loader);
    });

  });

  describe('initialization', function() {

    var fn = function() {};

    beforeEach(function() {
      subject = new TestAgent.BrowserWorker({
        testRunner: fn
      });
    });


    it('should save .testRunner option to testRunner', function() {
      expect(subject.testRunner).to.be(fn);
    });

    it('should have ._testsProcessor array', function() {
      expect(subject._testsProcessor).to.be.a(Array);
    });

    it('should have a .sandbox', function() {
      expect(subject.sandbox).to.be.a(TestAgent.Sandbox);
    });

    it('should have a .loader', function() {
      expect(subject.loader).to.be.a(TestAgent.Loader);
    });

    it('should be a responder', function() {
      expect(subject).to.be.a(TestAgent.Responder);
    });
  });

  describe('.use', function() {

    var Enhancer, data;

    beforeEach(function() {
      Enhancer = function(data) {
        this.saved = data;
      };
      Enhancer.prototype = {
        enhance: function(server) {
          server.wasEnhanced = this.saved;
        }
      };

      subject.use(Enhancer, data);
    });

    it('should have modified subject', function() {
      expect(subject.wasEnhanced).to.be(data);
    });

  });

  describe('on sandbox error', function() {
    var fakeErrorEvent = {}, calledWith;

    beforeEach(function(done) {
      subject.on('sandbox error', function() {
        calledWith = arguments;
        done();
      });
      subject.sandbox.emit('error', fakeErrorEvent);
    });

    it('should receive \'sandbox error\' event', function() {
      expect(calledWith).to.eql([fakeErrorEvent]);
    });
  });

  describe('.start', function() {
    var emitted = false;

    beforeEach(function() {
      emitted = false;
      subject.on('worker start', function() {
        emitted = true;
      });
      subject.start();
    });

    it('should emit worker start event', function() {
      expect(emitted).to.be(true);
    });

  });

  describe('.createSandbox', function() {
    var sandboxEvent, callbackData, iframe;

    beforeEach(function(done) {
      sandboxEvent = null;
      callbackData = null;

      subject.on('sandbox', function() {
        sandboxEvent = arguments;
      });

      subject.createSandbox(function() {
        callbackData = {
          context: this,
          args: arguments
        };
        done();
      });
    });

    it('should scope .loader to new iframe window', function() {
      var loader = subject.loader,
          sandbox = subject.sandbox;

      expect(loader.targetWindow === sandbox.getWindow()).to.be.ok();
    });

    describe('event: sandbox', function() {
      it('should send iframe context as first argument', function() {
        expect(sandboxEvent[0] !== window).to.be.ok();
        expect(sandboxEvent[0].Boolean).to.be.ok();
      });

      it('should pass loader as second argument', function() {
        expect(sandboxEvent[1]).to.be(subject.loader);
      });
    });

    describe('callback', function() {

      it('should be in the context of a new iframe', function() {
        expect(callbackData.context !== window).to.be.ok();
        expect(callbackData.context.Boolean).to.be.ok();
      });

      it('should pass loader as first argument', function() {
        expect(callbackData.args[0]).to.be(subject.loader);
      });

      it('should inject require into sandbox', function() {
        expect(callbackData.context.require).to.be.a(Function);
      });

    });

  });

  describe('.addTestsProcessor', function() {
    var fn = function() {};


    beforeEach(function() {
      subject.addTestsProcessor(fn);
    });

    it('should add function to _testsProcessor', function() {
      expect(subject._testsProcessor[0]).to.be(fn);
    });

  });

  describe('._processTests', function() {

    var result, tests = [
      'one', 'two'
    ];

    beforeEach(function() {

      subject.addTestsProcessor(function(tests) {
        return tests.map(function(item) {
          return String(item) + '-1';
        });
      });

      subject.addTestsProcessor(function(tests) {
        return tests.map(function(item) {
          return String(item) + '-2';
        });
      });

      result = subject._processTests(tests);
    });

    it('should call each reducer and return result', function() {
      expect(result).to.eql([
        'one-1-2',
        'two-1-2'
      ]);
    });

  });

  describe('.runTests', function() {

    var sandboxed = false,
        tests = ['foo'],
        runnerArguments = [],
        createSandbox;

    before(function() {
      createSandbox = TestAgent.BrowserWorker.prototype.createSandbox;
    });

    describe('without a test runner', function() {
      it('should throw an error', function() {
        expect(function() {
          subject.testRunner = null;
          subject.runTests(tests);
        }).to.throwError(/testRunner/);
      });
    });

    describe('with a working environment', function() {

      var obj = {uniq: true},
          expectedTests,
          sent = [],
          completeEvent = [];

      beforeEach(function(done) {

        sent.length = 0;
        runnerArguments = [];

        subject.createSandbox = function() {
          sandboxed = true;
          createSandbox.apply(this, arguments);
        };

        subject.addTestsProcessor(function(tests) {
          return tests.map(function(item) {
            return item + '-1';
          });
        });

        subject.testRunner = function(worker, tests, testsComplete) {
          runnerArguments.push(arguments);
          testsComplete(obj);
          done();
        };

        subject.send = function() {
          sent.push(arguments);
        }

        subject.on('run tests complete', function() {
          completeEvent.push(arguments);
        });

        expectedTests = subject._processTests(tests);

        subject.runTests(tests);
      });

      it('should emit run tests complete event', function() {
        expect(completeEvent[0][0]).to.be(obj);
      });

      it('should send run tests complete', function() {
        expect(sent[0][0]).to.eql('run tests complete');
      });

      it('should call .testRunner with self and tests', function() {
        var args = runnerArguments[0];
        expect(args[0]).to.be(subject);
        expect(args[1]).to.eql(expectedTests);
      });

    });

  });
});
