require_lib('test-agent/loader.js');

describe("TestAgent.Loader", function(){

  var targetIframe, subject, iframeContext,
      testArea;


  beforeEach(function(){
    subject = new TestAgent.Loader();
    testArea = document.getElementById('test');
  });

  function mockTime(){
    var now = Date.now;

    beforeEach(function(){
      var time = this.currentTime = Date.now();
      Date.now = function(){
        return time;
      };
    });

    afterEach(function(){
      Date.now = now;
    });
  }

  function createIframe(){

    beforeEach(function(done){
      var iframe = document.createElement('iframe');

      iframe.src = '/test/fixtures/iframe.html?time=' + String(Date.now());

      //interesting to note this must come before the listener...
      testArea.appendChild(iframe);

      iframe.contentWindow.addEventListener('DOMContentLoaded', function(){
        done();
      });

      targetIframe = iframe;
      iframeContext = subject.targetWindow = targetIframe.contentWindow;
    });
  }

  function getScript(){
    return iframeContext.document.querySelector('script:last-child');
  }

  describe("initializer", function(){

    beforeEach(function(){
      subject = new TestAgent.Loader({
        prefix: 'foo/',
        bustCache: false
      });
    });

    it("should set options from config", function(){
      expect(subject.prefix).to.be('foo/');
      expect(subject.bustCache).to.be(false);
    });

    it("should have set the targetWindow to the global window by default", function(){
      expect(subject.targetWindow).to.be(window);
    });

    it("should set ._cached to {}", function(){
      expect(subject._cached).to.be.a(Object);
    });

  });

  describe(".targetWindow", function(){

    describe("getting", function(){

      it("should be window by default", function(){
        expect(subject.targetWindow).to.be(window);
      });

    });

    describe("setting", function(){
      var iframeWindow;

      beforeEach(function(){
        subject._cached = {foo: true};
        subject.targetWindow = iframeWindow = {};
      });

      it("should clear cache", function(){
        expect(subject._cached).to.eql({});
      });

      it("should set .targetWindow", function(){
        expect(subject.targetWindow === iframeWindow).to.be(true);
      });
    });
  });

  describe(".require", function(){
    createIframe();

    var url = '/test/file.js';

    mockTime();

    function loadIframe(){
      var urls = Array.prototype.slice.call(arguments);

      beforeEach(function(done){
        urls.forEach(function(url){
          subject.require(url);
        });
        targetIframe.addEventListener('load', function(){
          done();
        });
      });
    }
    //intentionally twice
    loadIframe(url, url);

    it("should have marked /test/file.js as cached", function(){
      expect(subject._cached[url]).to.be(true);
    });

    it("should have only been included once", function(){
      var scripts = iframeContext.document.querySelectorAll('script[src^="' + url +'"]');
      expect(scripts.length).to.be(1);
    });

    it("should have added script to dom", function(){
      var script = getScript();
      expect(script.src).to.contain(url);
    });

    it("should include cache bust query string", function(){
      var script = getScript();
      expect(script.src).to.contain('?time=' + String(this.currentTime));
    });

    it("should execute script in the context of the iframe", function(){
      expect(iframeContext.TEST_FILE_WAS_LOADED).to.be(true);
    });

    it("should be using iframe window context (in this test)", function(){
      //unsual case where we need to use '===' over the to.be matcher
      expect(subject.targetWindow === targetIframe.contentWindow).to.be(true);
    });

  });

});
