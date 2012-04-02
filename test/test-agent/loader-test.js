describe("TestAgent.Loader", function(){

  var targetIframe, subject, iframeContext,
      testArea;


  beforeEach(function(){
    subject = new TestAgent.Loader();
    testArea = document.getElementById('test');
  });

  function createIframe(){

    beforeEach(function(done){
      var iframe = document.createElement('iframe');

      iframe.src = './test/fixtures/iframe.html?time=' + String(Date.now());

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

  });

  describe(".require", function(){
    createIframe();

    var url = 'test/file.js',
        time = Date.now,
        ms;


    beforeEach(function(done){
      ms = time();
      Date.now = function(){
        return ms;
      };

      subject.require('/test/file.js');
      targetIframe.addEventListener('load', function(){
        done();
      });
    });

    afterEach(function(){
      Date.now = time;
    });

    it("should have added script to dom", function(){
      var script = getScript();
      expect(script.src).to.contain(url);
    });

    it("should include cache bust query string", function(){
      var script = getScript();
      expect(script.src).to.contain('?time=' + String(ms));
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
