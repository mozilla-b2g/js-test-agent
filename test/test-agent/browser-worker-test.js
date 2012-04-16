require_lib('test-agent/responder.js');
require_lib('test-agent/loader.js');
require_lib('test-agent/sandbox.js');
require_lib('test-agent/websocket-client.js');
require_lib('test-agent/browser-worker.js');

describe("test-agent/browser-worker", function(){
  
  var subject, fn = function(){};

  beforeEach(function(){
    subject = new TestAgent.BrowserWorker({
      sandbox: '/test/fixtures/iframe.html',
      testRunner: fn
    });
  });

  describe(".deps", function(){
    var deps;
    beforeEach(function(){
      deps = TestAgent.BrowserWorker.prototype.deps;
    });

    it("should have Server set to TestAgent.Server", function(){
      expect(deps.Server).to.be(TestAgent.WebsocketClient);
    });

    it("should have Sandbox set to TestAgent.Sanbox", function(){
      expect(deps.Sanbox).to.be(TestAgent.Sanbox);
    });

    it("should have Loader set to TestAgent.Loader", function(){
      expect(deps.Loader).to.be(TestAgent.Loader);
    });

  });

  describe("initialization", function(){

    var fn = function(){};

    beforeEach(function(){
      subject = new TestAgent.BrowserWorker({
        testRunner: fn
      });
    });

    describe("without a test runner", function(){
      it("should throw an error", function(){
        expect(function(){
          new TestAgent.BrowserWorker({sandbox: 'foo'});
        }).to.throwError(/testRunner/);
      });
    });

    it("should save .testRunner option to testRunner", function(){
      expect(subject.testRunner).to.be(fn);
    });

    it("should use default options for server when none are given", function(){
      expect(subject.url).to.be(subject.defaults.server.url);
      expect(subject.retry).to.be(subject.defaults.server.retry);
    });

    it("should use default options for sandbox when none given", function(){
      expect(subject.sandbox.url).to.be(subject.defaults.sandbox);
    });

    it("should have a .sandbox", function(){
      expect(subject.sandbox).to.be.a(TestAgent.Sandbox);
    });

    it("should have a .loader", function(){
      expect(subject.loader).to.be.a(TestAgent.Loader);
    });

    it("should be a websocket client", function(){
      expect(subject).to.be.a(TestAgent.WebsocketClient);
    });
  });

  describe(".createSandbox", function(){
    var sandboxEvent, callbackData;

    beforeEach(function(done){
      sandboxEvent = null;
      callbackData = null;

      subject.on('sandbox', function(){
        sandboxEvent = arguments;
      });

      subject.createSandbox(function(){
        callbackData = {
          context: this,
          args: arguments
        };
        done();        
      });
    });

    it("should scope .loader to new iframe window", function(){
      expect(subject.loader.targetWindow === subject.sandbox.getWindow()).to.be.ok();
    });

    describe("event: sandbox", function(){
      it("should send iframe context as first argument", function(){
        expect(sandboxEvent[0] !== window).to.be.ok();
        expect(sandboxEvent[0].Boolean).to.be.ok(); 
      });

      it("should pass loader as second argument", function(){
        expect(sandboxEvent[1]).to.be(subject.loader);
      });
    });

    describe("callback", function(){

      it("should be in the context of a new iframe", function(){
        expect(callbackData.context !== window).to.be.ok();
        expect(callbackData.context.Boolean).to.be.ok(); 
      });

      it("should pass loader as first argument", function(){
        expect(callbackData.args[0]).to.be(subject.loader);
      });

    });

  });

  describe(".runTests", function(){

    var sandboxed = false,
        tests = ['foo'],
        runnerArguments = [],
        createSandbox;

    before(function(){
      createSandbox = TestAgent.BrowserWorker.prototype.createSandbox;   
    });

    beforeEach(function(done){
      subject.createSandbox = function(){
        sandboxed = true;
        createSandbox.apply(this, arguments);
      };

      subject.testRunner = function(){
        runnerArguments.push(arguments);
        done();
      };

      subject.runTests(tests);
    });

    it("should call .testRunner with self and tests", function(){
      var args = runnerArguments[0];
      expect(args[0]).to.be(subject);
      expect(args[1]).to.be(tests);
    });

  });
});
