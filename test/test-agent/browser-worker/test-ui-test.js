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
