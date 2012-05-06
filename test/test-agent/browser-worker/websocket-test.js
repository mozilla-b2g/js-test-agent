requireLib('*test-agent/browser-worker');
requireLib('test-agent/browser-worker/websocket.js');

describe('test-agent/browser-worker/websocket', function() {

  var subject,
      worker,
      startCalled,
      sent;

  beforeEach(function() {
    worker = TestAgent.factory.browserWorker();
    subject = new TestAgent.BrowserWorker.Websocket();

    sent = null;
    startCalled = false;

    subject.socket.start = function() {
      startCalled = true;
    }

    subject.socket.send = function() {
      sent = arguments;
    }

    subject.enhance(worker);
  });

  describe('initialization', function() {

    it('should setup .socket', function() {
      expect(subject.socket).to.be.a(TestAgent.WebsocketClient);
      expect(subject.socket.url).to.be(
        subject.defaults.url
      );

      expect(subject.socket.retry).to.be(
        subject.defaults.retry
      );
    });
  });


  describe('worker.send', function() {

    beforeEach(function() {
      worker.send('amazing', 'foo');
    });

    it('should delegate send calls to socket', function() {
      expect(sent).to.eql(['amazing', 'foo']);
    });
  });

  describe('when socket emits an event', function() {
    var eventStack = [];

    beforeEach(function() {
      eventStack.length = 0;
      worker.emit = function() {
        eventStack.push(arguments);
      };

      subject.socket.emit('foo', 1);
      subject.socket.emit('bar', 2);
    });

    it('should mirror all events to worker', function() {
      expect(eventStack).to.eql([
        ['foo', 1],
        ['bar', 2]
      ]);
    });
  });

  describe('event: worker start', function() {
    beforeEach(function() {
      worker.start();
    });

    it('should start socket', function() {
      expect(startCalled).to.be(true);
    });
  });

});
