requireLib('*test-agent/browser-worker');
requireLib('test-agent/mocha/json-stream-reporter.js');
requireLib('test-agent/browser-worker/mocha-driver.js');

describe('test-agent/browser-worker/mocha-driver', function() {
  var subject,
      worker,
      baseUrl = '/test/test-agent/fixtures/mocha-driver/',
      reporterCalled = [],
      requireContext,
      MochaDriver,
      origTestRunner;


  function createReporter() {
    return function() {
      reporterCalled.push(arguments);
    };
  }

  beforeEach(function() {
    reporterCalled = [];
  });

  beforeEach(function() {
    MochaDriver = TestAgent.BrowserWorker.MochaDriver;
    subject = new TestAgent.BrowserWorker.MochaDriver({
      mochaUrl: '/vendor/mocha/mocha.js',
      testHelperUrl: baseUrl + 'test-helper.js'
    });

    worker = TestAgent.factory.browserWorker();
    origTestRunner = worker.testRunner;
    subject.enhance(worker);
  });

  describe('MochaDriver.createMutliReporter', function() {

    var runner;

    beforeEach(function() {
      runner = {};
      var report = MochaDriver.createMutliReporter(
        createReporter(),
        createReporter()
      );

      new report(runner);
    });

    it('should initialize each reporter in the mutli with a runner when its given', function() {
      expect(reporterCalled.length).to.be(2);
      reporterCalled.forEach(function(call) {
        expect(call[0]).to.be(runner);
      });
    });

  });

  describe('initialization', function() {
    it('should replace .testRunner with enhanced functionality', function() {
      expect(worker.testRunner).to.be.a(Function);
      expect(worker.testRunner).not.to.be(origTestRunner);
    });
  });

  describe('.getReporter', function() {

    describe('when env is set on worker', function() {
      var result;

      beforeEach(function() {
        worker.env = 'chrome';
        result = subject.getReporter({
          console: function(){},
          mocha: {
            reporters: {
              HTML: function() {}
            }
          }
        });
      });

      it('should set testAgentEnvId on JsonStreamReporter', function() {
        expect(TestAgent.Mocha.JsonStreamReporter.testAgentEnvId).to.be('chrome');
      });

    });

  });

  describe('in test environment', function() {
    var tests = [baseUrl + 'test.js'],
        getReporterCalled = false,
        sent = [];

    beforeEach(function(done) {
      getReporterCalled = false;
      sent.length = 0;

      //mock out reporter to default
      subject.getReporter = function() {
        getReporterCalled = true;
        return null;
      };

      worker.on('sandbox', function() {
        var box = worker.sandbox.getWindow();

        box.document.body.innerHTML = '<div id="mocha"></div>';
        box.testWasCalled = false;
        box.testHelperWasCalled = false;
      });

      worker.on('run tests complete', function() {
        done();
      });

      worker.runTests(tests);
    });

    it('should load everything into the environment and run tests', function() {
      //this test is merged into one it block for speed
      var context = worker.sandbox.getWindow();

      //get reporter was called
      expect(getReporterCalled).to.be(true);

      //test helper worked
      expect(context.testHelperWasCalled).to.be(true);

      //test executed fine
      expect(context.testWasCalled).to.be(true);
    });

  });

});
