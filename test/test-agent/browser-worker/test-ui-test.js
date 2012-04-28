requireLib('*test-agent/browser-worker');
requireLib('test-agent/browser-worker/test-ui.js');

describe('test-agent/browser-worker/test-ui', function() {

  var subject,
      worker,
      element,
      data = {
        'tests': ['one', 'two']
      };

  beforeEach(function() {
    worker = TestAgent.factory.browserWorker();
    document.getElementById('test').innerHTML = '<div id="test-ui-test"></div>';
    element = document.getElementById('test-ui-test');

    subject = new TestAgent.BrowserWorker.TestUi({
      selector: '#test #test-ui-test'
    });

    subject.enhance(worker);
  });

  describe('initialization', function() {
    it("should have set .element to selector's element", function() {
      expect(subject.element).to.be(document.getElementById('test-ui-test'));
    });

    it('should hide errorElement', function() {
      var className = subject.errorElement.className;
      expect(className).to.contain(subject.HIDDEN);
      expect(className).to.contain('error');
    });
  });

  describe('event: config', function() {
    beforeEach(function() {
      worker.emit('config', data);
    });

    it('should paint ui', function() {
      var items = element.querySelectorAll('li'),
          i = 0;
      //should have ul
      expect(element.getElementsByTagName('ul')[0]).to.be.ok();

      for (; i < data.tests.length; i++) {
        expect(items[i].innerHTML).to.contain(data.tests[i]);
      }

      expect(element.querySelector('button')).to.be.ok();
    });
  });

  describe('syntax error handling', function() {
    var data = {
      filename: 'some?time=thing',
      lineno: 20,
      message: 'foobar'
    };

    describe('on error', function() {
      beforeEach(function() {
        worker.emit('sandbox error', data);
      });

      it('should create error ui and show it', function() {
        var content = subject.errorElement.innerHTML;
        expect(content).to.contain('some');
        expect(content).to.contain('foobar');
        expect(content).to.contain('20');
        expect(subject.errorElement.className).not.to.contain(
          subject.HIDDEN
        );
      });

      describe('after re-running', function() {
        beforeEach(function() {
          worker.emit('sandbox');
        });

        it('should hide error', function() {
          expect(subject.errorElement.className).to.contain(
            subject.HIDDEN
          );
        });
      });

    });
  });

  describe('.initDomEvents', function() {

    var runEvent;

    function triggerEvent(element, eventName) {
      var event = document.createEvent('HTMLEvents');
      event.initEvent(eventName, true, true);
      element.dispatchEvent(event);
    }

    function triggerTestElement(isActive, element) {
      var url = element.getAttribute('data-url');
      triggerEvent(element, 'click');

      if (isActive) {
        expect(element.className).to.contain('active');
        expect(subject.queue[url]).to.be.ok();
      } else {
        expect(element.className).to.not.contain('active');
        expect(subject.queue[url]).not.to.be.ok();
      }
    }

    beforeEach(function() {
      runEvent = [];
      worker.on('run tests', function() {
        runEvent.push(arguments);
      });
      worker.emit('config', data);
    });

    it('should emit runTests event on worker when tests are selected', function() {
      var button = element.querySelector('button'),
          tests = element.querySelectorAll('li'),
          i = 0;

        for (; i < tests.length; i++) {
          triggerTestElement(true, tests[i]);
          triggerTestElement(false, tests[i]);
          triggerTestElement(true, tests[i]);
        }

        triggerEvent(button, 'click');

        expect(runEvent[0][0]).to.eql({tests: data.tests});
    });

  });

});
