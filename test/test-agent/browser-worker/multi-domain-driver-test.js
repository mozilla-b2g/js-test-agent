requireLib('*test-agent/browser-worker');
requireLib('test-agent/browser-worker/multi-domain-driver.js');

describe('test-agent/browser-worker/multi-domain-driver', function() {
  var subject,
      worker,
      MultiDomainDriver,
      iframeUrl = '/test/fixtures/iframe.html',
      win,
      files,
      posted = [];


  files = [
    'a/app-test.js',
    'b/app-test.js'
  ];

  function mockIframe() {
    return {
      contentWindow: {
        postMessage: function(file) {
          posted.push(arguments);
        }
      }
    };
  }

  function windowMessage() {
    win.emit('message', {
      data: Array.prototype.slice.call(arguments)
    });
  }

  function getDomain(name) {
    var split = name.split('/');
    return 'http://' + split[0] + '.com/test/index.html';
  }

  after(function() {
    var iframes = document.querySelectorAll('iframe'),
        i = 0;

    for (i; i < iframes.length; i++) {
      iframes[i].parentNode.removeChild(iframes[i]);
    }
  });

  beforeEach(function() {
    win = new TestAgent.Responder();
    posted.length = 0;
    MultiDomainDriver = TestAgent.BrowserWorker.MultiDomainDriver;

    subject = new MultiDomainDriver({
      window: win,
      groupTestsByDomain: function(file) {
        return {
          domain: getDomain(file),
          env: file.split('/')[0],
          test: file.split('/').slice(1).join('/')
        };
      }
    });

    worker = TestAgent.factory.browserWorker();
    subject.enhance(worker);
  });

  describe('initialization', function() {
    it('should set .testGroups', function() {
      expect(subject.testGroups).to.eql({});
    });

    it('should set .groupTestsByDomain', function() {
      expect(subject.groupTestsByDomain).to.be.a(Function);
    });

  });

  describe('.enhance', function() {
    it('should override runTests method', function() {
      expect(worker.runTests).not.to.be(
        TestAgent.BrowserWorker.prototype.runTests
      );
    });
  });

  describe('.send', function() {
    var iframe;

    beforeEach(function() {
      iframe = mockIframe();

      subject.send(iframe, 'event', 'data');
    });

    it('should send message to iframe', function() {
      expect(posted).to.eql([
        [JSON.stringify(['event', 'data']), subject.allowedDomains]
      ]);
    });
  });


  describe('.createIframe', function() {

    var result;

    describe('without iframeAttrs', function() {

      beforeEach(function() {
        result = subject.createIframe(iframeUrl);
      });

      afterEach(function() {
        result.parentNode.removeChild(result);
      });

      it('should append iframe', function() {
        var el = document.querySelector('iframe:last-child');
        expect(el.src).to.contain(iframeUrl);
        // !! for safari compat
        expect(!!result.contentWindow).to.be.ok();
      });

    });

    describe('with iframeAttrs', function() {
      beforeEach(function() {
        subject.iframeAttrs = {
          mozFoo: 'foo'
        };

        result = subject.createIframe(iframeUrl);
      });

      it('should append iframe with attrs', function() {
        var el = document.querySelector('iframe:last-child');
        expect(el.src).to.contain(iframeUrl);
        expect(el.getAttribute('mozFoo')).to.equal('foo');
      });
    });



  });

  describe('.removeIframe', function() {
    var iframe, len;

    beforeEach(function() {
      len = document.getElementsByTagName('iframe').length;

      iframe = subject.createIframe(iframeUrl);
      subject.removeIframe(iframe);
    });

    it('should remove iframe', function() {
      var newLen = document.getElementsByTagName('iframe').length;
      expect(newLen).to.be(len);
    });
  });

  describe('._loadNextDomain', function() {

    var createdIframe = false,
        createdFor,
        removed = [],
        iframe;

    beforeEach(function() {
      removed.length = 0;
      subject._createTestGroups(files);
      subject.removeIframe = function(frame) {
        removed.push(frame);
      }
    });

    function loadNext(env) {
      var url = getDomain(env);

      beforeEach(function() {
        createdFor = null;
        subject.createIframe = function(src) {
          createdIframe = true;
          createdFor = src;
          return iframe = mockIframe();
        }

        subject._loadNextDomain();
      });

      it('should not remove reference to current environment', function() {
        expect(subject.testGroups[env]).to.be.ok();
      });

      it('should save reference to iframe', function() {
        expect(subject.sandboxes[env]).to.be(iframe);
      });

      it('should load iframe', function() {
        expect(createdIframe).to.be(true);
        expect(createdFor).to.be(url);
      });

      it('should set .currentEnv', function() {
        expect(subject.currentEnv).to.be(env);
      });
    }

    loadNext('a');

    describe('after first call', function() {
      loadNext('b');

      it('should remove iframe', function() {
        expect(removed.length).to.be(1);
      });

      it('should remove reference to first domain', function() {
        var domain = getDomain('a');
        expect(subject.testGroups[domain]).not.to.be.ok();
      });

    });
  });

  describe('._startDomainTests', function() {
    var iframe,
        env = 'a',
        domain = getDomain(env);

    beforeEach(function() {
      subject.sandboxes[env] = iframe = mockIframe();
      subject._createTestGroups(files);
      subject._startDomainTests(env);
    });


    it('should send message to domain to set env', function() {
      expect(posted[0][0]).to.eql(
        JSON.stringify(['set env', 'a'])
      );
    });

    it('should send message to domain to run tests', function() {
      expect(posted[1][0]).to.eql(
        JSON.stringify(['run tests', {tests: ['app-test.js']}])
      );
    });
  });

  describe('._createTestGroups', function() {
    var result, list,
        expected;

    list = [
      'a/1.js',
      'a/2.js',
      'b/file.js'
    ];

    beforeEach(function() {
      subject.testGroups = {'z': 'foo.js'};
      subject._createTestGroups(list);

      expected = {};

      expected['a'] = {
        env: 'a',
        tests: ['1.js', '2.js'],
        domain: getDomain('a')
      };

      expected['b'] = {
        env: 'b',
        tests: ['file.js'],
        domain: getDomain('b')
      };
    });

    it('should remove old results', function() {
      expect(subject.testGroups.z).not.to.be.ok();
    });

    it('should group tests based on .groupTestsByDomain', function() {
      expect(subject.testGroups).to.eql(expected);
    });
  });

  describe('event: window.onmessage', function() {
    var sent = [],
        emitted = [];

    function captureEvent(e) {
      worker.on(e, function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(e);
        emitted.push(args);
      });
    }

    beforeEach(function() {
      emitted.length = 0;
      sent.length = 0;

      captureEvent('foo');
      captureEvent('test data');
      worker.send = function() {
        sent.push(arguments);
      }

      windowMessage('foo', 1);
      windowMessage('test data', 2);
    });

    it('should emit but not send foo', function() {
      expect(emitted[0]).to.eql([
        'foo', 1
      ]);
      expect(sent.length).to.be(1);
    });

    it('should emit and send test data', function() {
      expect(emitted[1]).to.eql([
        'test data', 2
      ]);

      expect(sent[0]).to.eql([
        'test data', 2
      ]);
    });

  });

  describe('event: run tests complete', function() {
    var calledNext;

    beforeEach(function() {
      calledNext = false;
      subject._loadNextDomain = function() {
        calledNext = true;
      }

      worker.emit('run tests complete');
    });

    it('should call next', function() {
      expect(calledNext).to.be(true);
    });

  });

  describe('event: worker start', function() {
    var env = 'a',
        domain = getDomain(env),
        starting = [];

    beforeEach(function() {
      starting.length = 0;
      subject._startDomainTests = function(current) {
        starting.push(current);
      }

      subject.createIframe = mockIframe();
      subject.currentEnv = env;
      subject._createTestGroups(files);
    });

    describe('without type', function() {
      beforeEach(function() {
        worker.emit('worker start');
      });

      it('should not trigger anything', function() {
        expect(starting.length).to.be(0);
      });
    });

    describe('with type post-message', function() {
      beforeEach(function() {
        worker.emit('worker start', { type: 'post-message'});
      });

      it('should start tests for current domain', function() {
        expect(starting[0]).to.be(env);
      });
    });

  });

  describe('.runTests', function() {
    var sent = [],
        emitted = [];

    beforeEach(function() {
      sent.length = 0;
      emitted.length = 0;

      subject.worker.send = function() {
        sent.push(arguments);
      }

      worker.on('set test envs', function() {
        emitted.push(arguments);
      });

      subject.runTests(files);
    });

    it('should emit add envs', function() {
      expect(sent[0]).to.eql([
        'set test envs', ['a', 'b']
      ]);
    });

    it('should send add envs', function() {
      expect(sent[0]).to.eql([
        'set test envs', ['a', 'b']
      ]);
    });

  });

});
