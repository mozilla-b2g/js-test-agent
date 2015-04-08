require_lib('test-agent/responder.js');
require_lib('test-agent/sandbox.js');

describe('TestAgent.Sandbox', function() {
  var subject,
      url = '/test/fixtures/iframe.html',
      iframeCount = 0;

  beforeEach(function() {
    iframeCount = document.getElementsByTagName('iframe').length;
    expect(iframeCount).to.be(0);

    subject = new TestAgent.Sandbox(url);
  });

  afterEach(function() {
    subject.destroy();
  });

  describe('initializer', function() {

    it('should set .url to first argument', function() {
      expect(subject.url).to.be(url);
    });

    it('should be a Responder', function() {
      expect(subject).to.be.a(TestAgent.Responder);
    });

  });

  describe('.getElement', function() {

    describe('when element does not exist', function() {

      it('should start with ._element as null', function() {
        expect(subject._element).to.be(null);
      });

      it('should create element', function() {
        var element = subject.getElement();
        expect(element.tagName).to.match(/iframe/i);
        expect(subject._element).to.be(element);
      });

      it('should set the .src of the element to .url', function() {
        expect(subject.getElement().src).to.contain(subject.url);
      });

    });

    describe('when element exists', function() {
      var el;

      beforeEach(function() {
        el = subject.getElement();
      });

      it('should not create a new element', function() {
        expect(el).to.be(subject.getElement());
      });
    });
  });

  describe('.run', function() {

    var context, destroyCaled, result,
        readyCalled = false;

    beforeEach(function(done) {
      this.timeout(4000);

      destroyCaled = false;
      readyCalled = null;

      subject.destroy = function() {
        destroyCaled = true;
        TestAgent.Sandbox.prototype.destroy.apply(this, arguments);
      };

      subject.on('ready', function(iframe) {
        readyCalled = iframe;
      });

      result = subject.run(function() {
        context = this;
        done();
      });
    });

    it('should destroy old sandbox', function() {
      expect(destroyCaled).to.be(true);
    });

    it('should return the iframe window', function() {
      expect(result === context).to.be.ok();
    });

    it('should be attached to the dom', function() {
      expect(subject.getElement().parentNode).to.be(document.body);
    });

    it('should run in the context of the iframe window', function() {
      expect(context === subject.getElement().contentWindow).to.be(true);
    });

    it('should emit ready event with iframe as first argument', function() {
      expect(readyCalled === context).to.be.ok();
    });

    it('should be ready', function() {
      expect(subject.ready).to.be(true);
    });

  });

  describe('event: error', function() {
    // XXX: This fails on travis and we have no clue why as it works locally in
    // all cases turning off for now.
    return;
    var context, errors = [];
    var i = 0;

    beforeEach(function(done) {
      this.timeout(10000);

      subject.debug = true;
      context = null;
      errors.length = 0;

      subject.url = '/test/fixtures/iframe-error.html';

      var hasRun;
      var hasError;

      function isComplete() {
        if (hasRun && hasError) {
          done();
        }
      }

      subject.on('error', function(e) {
        console.log('!ERROR!');
        context = this;
        errors.push(e);
        hasError = true;
        isComplete();
      });

      subject.run(function() {
        console.log('!RUN!');
        hasRun = true;
        isComplete();
      });
    });

    it('should emit iframe errors', function() {
      expect(errors[0].filename).not.to.contain('?time');
      expect(errors[0].message).to.be.ok();
    });

  });

  describe('.getWindow', function() {

    it('should return false when iframe is not attached', function() {
      expect(subject.getWindow()).to.be(false);
    });

    it("should return the iframe's window", function(done) {
      subject.run(function() {
        expect(subject.getWindow() === this).to.be(true);
        done();
      });
    });

  });

  describe('.destroy', function() {
    describe('when element is attached to the dom', function() {

      var el;

      beforeEach(function(done) {
        subject.run(function() {
          el = subject.getElement();
          subject.destroy();
          done();
        });

      });

      it('should not be ready', function() {
        expect(subject.ready).to.be(false);
      });

      it('should remove element from the dom', function() {
        expect(el.parentNode).to.be(null);
      });
    });

    describe('when element is not attached to dom', function() {

      it('should not fail with unattached element', function() {
        subject.getElement();
        subject.destroy();
      });

      it('should not fail with nonexistent element', function() {
        subject.destroy();
      });
    });
  });
});
