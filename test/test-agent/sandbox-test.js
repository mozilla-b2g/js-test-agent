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

    var context, destroyCaled, result;

    beforeEach(function(done) {
      this.timeout(100000000);
      destroyCaled = false;

      subject.destroy = function() {
        destroyCaled = true;
        TestAgent.Sandbox.prototype.destroy.apply(this, arguments);
      };

      result = subject.run(function() {
        context = this;
        done();
      });
    });

    it('should destroy old sandbox', function() {
      expect(destroyCaled).to.be(true);
    });

    it('should return the iframe window', function() {
      expect(result).to.be(context);
    });

    it('should be attached to the dom', function() {
      expect(subject.getElement().parentNode).to.be(document.body);
    });

    it('should run in the context of the iframe window', function() {
      expect(context === subject.getElement().contentWindow).to.be(true);
    });

    it('should be ready', function() {
      expect(subject.ready).to.be(true);
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
        this.timeout(4000);
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
