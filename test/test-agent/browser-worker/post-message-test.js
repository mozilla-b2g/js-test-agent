requireLib('*test-agent/browser-worker');
requireLib('test-agent/browser-worker/post-message.js');

describe('test-agent/browser-worker/post-message', function() {

  var subject,
      messages = [],
      worker,
      allowedDomain,
      setupListener,
      window = { uniq: true },
      windowListener,
      targetWindow = {
        postMessage: function(message, allowed) {
          messages.push(message);
          allowedDomain = allowed;
        }
      };


  function sendMessage(data) {
    windowListener.call(this, {
      data: data
    });
  }

  beforeEach(function() {
    setupListener = false;

    window.addEventListener = function(type, callback) {
      if (type === 'message') {
        setupListener = true;
        windowListener = callback;
      }
    };

    messages.length = 0;
    worker = TestAgent.factory.browserWorker();
    subject = new TestAgent.BrowserWorker.PostMessage();

    subject.window = window;
    subject.targetWindow = targetWindow;

    subject.enhance(worker);
  });


  describe('worker.send', function() {
    beforeEach(function() {
      worker.send('event', 'data');
    });

    it('should post a message to targetWindow', function() {
      expect(messages).to.eql([
        ['event', 'data']
      ]);
    });
  });

  describe('receiving window message', function() {

    it('should setup listener', function() {
      expect(setupListener).to.be(true);
    });

    it('should respond to events sent by other windows', function(done) {
      worker.on('magic event', function(data) {
        expect(data).to.be('data');
        done();
      });

      sendMessage(['magic event', 'data']);
    });

  });

});
