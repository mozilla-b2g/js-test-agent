require_lib('test-agent/loader.js');

describe('TestAgent.Loader', function() {

  var targetIframe, subject, iframeContext,
      testArea;


  beforeEach(function() {
    subject = new TestAgent.Loader();
    testArea = document.getElementById('test');
  });

  function mockTime() {
    var now = Date.now;

    beforeEach(function() {
      var time = this.currentTime = Date.now();
      Date.now = function() {
        return time;
      };
    });

    afterEach(function() {
      Date.now = now;
    });
  }

  function createIframe() {

    beforeEach(function(done) {
      this.timeout(10000);
      var iframe = document.createElement('iframe');

      iframe.src = '/test/fixtures/iframe.html?time=' + String(Date.now());

      //interesting to note this must come before the listener...
      testArea.appendChild(iframe);

      iframe.contentWindow.addEventListener('DOMContentLoaded', function() {
        done();
      });

      targetIframe = iframe;
      iframeContext = subject.targetWindow = targetIframe.contentWindow;
    });
  }

  function getScript() {
    return iframeContext.document.querySelector('script:last-child');
  }

  describe('initializer', function() {

    beforeEach(function() {
      subject = new TestAgent.Loader({
        prefix: 'foo/',
        bustCache: false
      });
    });

    it('should set options from config', function() {
      expect(subject.prefix).to.be('foo/');
      expect(subject.bustCache).to.be(false);
    });

    it('should have set the targetWindow to the global window by default', function() {
      expect(subject.targetWindow).to.be(window);
    });

    it('should have .doneCallbacks', function() {
      expect(subject.doneCallbacks).to.eql([]);
    });

    it('should set ._cached to {}', function() {
      expect(subject._cached).to.be.a(Object);
    });

  });

  describe('.targetWindow', function() {

    describe('getting', function() {

      it('should be window by default', function() {
        expect(subject.targetWindow).to.be(window);
      });

    });

    describe('setting', function() {
      var iframeWindow;

      beforeEach(function() {
        subject._cached = {foo: true};
        subject.targetWindow = iframeWindow = {};
      });

      it('should clear cache', function() {
        expect(subject._cached).to.eql({});
      });

      it('should set .targetWindow', function() {
        expect(subject.targetWindow === iframeWindow).to.be(true);
      });
    });
  });

  describe('.done', function() {
    var doneCalled = false,
        fn = function() {
          doneCalled = true;
        };


    beforeEach(function() {
      doneCalled = false;
    });

    beforeEach(function() {
      subject.done(fn);
    });

    it('should add callback to .doneCallbacks', function() {
      expect(subject.doneCallbacks[0]).to.be(fn);
    });

    it('should not fire events', function() {
      expect(doneCalled).to.be(false);
    });

  });

  describe('.require', function() {
    createIframe();
    mockTime();

    var url = '/test/file.js',
        requireCallbacksFired = [];

    function loadIframe() {
      var urls = Array.prototype.slice.call(arguments);
      requireCallbacksFired = [];

      beforeEach(function(done) {
        this.timeout(10000);
        urls.forEach(function(url) {
          subject.require(url, function() {
            requireCallbacksFired.push(arguments);
          });
        });

        subject.done(function() {
          done();
        });
      });
    }

    describe('nested requires /w cached files', function() {
      var order = [],
          cacheUrl = '/test/file.js',
          url = '/test/fixtures/tests/one-test.js';

      beforeEach(function(done) {
        order.length = 0;

        subject.done(function() {
          order.push('done');
          done();
        });

        subject.require(cacheUrl, function() {
          order.push('require');
        });

        subject.require(cacheUrl, function() {
          order.push('cache');
          subject.require(url, function() {
            order.push('nested require');
          });
        });
      });

      it('should load files in the correct order.', function() {
        var scripts;
        expect(order).to.eql([
          'require', 'cache', 'nested require', 'done'
        ]);

        scripts = iframeContext.document.getElementsByTagName('script');

        expect(scripts.length).to.be(2);

        expect(scripts[0].src).to.contain(cacheUrl);
        expect(scripts[1].src).to.contain(url);
      });

    });

    describe('cross domain require', function() {
      var url = 'https://raw.github.com/LearnBoost/expect.js/master/expect.js';

      beforeEach(function(done) {
        //when your on a slow hotel connection :p
        this.timeout(10000);
        subject.require(url);
        subject.done(function() {
          done();
        });
      });

      it('should successfully require and fire callbacks', function() {
        expect(iframeContext.expect).to.be.ok();
      });

    });

    describe('missing file', function() {
      var url = 'https://localhost:7711/iamnotfoundfoobar.js';

      it('should still fire done', function(done) {
        subject.require(url);

        subject.done(function() {
          done();
        });
      });
    });

    describe('basic functionality', function() {

      //intentionally twice
      loadIframe(url, url);

      it('should fire both require callbacks', function() {
        expect(requireCallbacksFired.length).to.be(2);
      });

      it('should have marked /test/file.js as cached', function() {
        expect(subject._cached[url]).to.be(true);
      });

      it('should have only been included once', function() {
        var doc = iframeContext.document;
        var scripts = doc.querySelectorAll('script[src^="' + url + '"]');
        expect(scripts.length).to.be(1);
      });

      it('should have added script to dom', function() {
        var script = getScript();
        expect(script.src).to.contain(url);
        expect(script.async).to.be(false);
        expect(script.type).to.be(subject.type);
      });

      it('should include cache bust query string', function() {
        var script = getScript();
        expect(script.src).to.contain('?time=' + String(this.currentTime));
      });


      it('should execute script in the context of the iframe', function() {
        expect(iframeContext.TEST_FILE_WAS_LOADED).to.be(true);
      });

      it('should be using iframe window context (in this test)', function() {
        //unsual case where we need to use '===' over the to.be matcher
        expect(subject.targetWindow === targetIframe.contentWindow).to.be(true);
      });

    });

  });

});
