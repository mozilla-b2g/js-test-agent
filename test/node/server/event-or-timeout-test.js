var Apps = requireLib('node/server'),
    Timeout = requireLib('node/server/event-or-timeout');

describe('node/server/event-or-timeout', function() {
  var subject,
      server,
      factory = require('../factory/websocket-server');

  beforeEach(function() {
    subject = new Timeout({
      timeout: 250,
      event: 'test-data'
    });

    server = factory.websocketServer();

    server.use(Apps.Responder);
  });

  describe('initializer', function() {
    it('should set .timeout', function() {
      expect(subject.timeout).to.be(250);
    });

    it('should set event', function() {
      expect(subject.event).to.be('test-data');
    });
  });

  describe('when no event is sent', function() {
    var errorCalled;

    it('should throw an error', function(done) {
      subject.timeoutHandler = function() {
        errorCalled = true;
      };

      subject.enhance(server);

      setTimeout(function() {
        expect(errorCalled).to.be(true);
        done();
      }, 300);
    });
  });

  describe('when an event is fired once', function() {
    var errorCalled = false;

    it('should not fire an error even if one event is fired', function() {
      subject.timeoutHandler = function() {
        errorCalled = true;
      };
      subject.enhance(server);

      setTimeout(function() {
        server.emit('test-data');
      }, 100);

      setTimeout(function() {
        expect(errorCalled).to.be(false);
      }, 500);
    });
  });

});

