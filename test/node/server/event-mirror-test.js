var EventMirror = require_lib('node/server/event-mirror'),
    AppResponder = require_lib('node/server/responder'),
    WebsockeServer = require_lib('node/websocket-server'),
    Reporter = require_lib('test-agent/mocha/reporter'),
    Responder = require_lib('test-agent/responder');

describe('node/server/event-mirror', function() {

  var server,
      subject,
      clientSocket1,
      clientSocket2,
      workerSocket,
      serverEvents = [],
      factory = require('../factory/websocket-server');

  function clientsSend(event, data) {
    var data = server.stringify(event, data);
    clientSocket1.emit('message', data);
    clientSocket2.emit('message', data);
  }

  function workerSend(event, data) {
    workerSocket.emit('message', [event, data]);
  }

  function sendWorkerEvents() {
    workerSend('foo', 1);
    workerSend('bar', 2);
  }

  function mirrorEvents(capture) {
    beforeEach(function() {
      clientsSend('mirror events add', {
        events: ['foo', 'bar'],
        capture: capture
      });
    });
  }


  beforeEach(function() {
    var oldEmit;
    subject = new EventMirror();

    server = factory.websocketServer();

    oldEmit = server.emit;
    server.emit = function() {
      serverEvents.push(arguments);
      oldEmit.apply(this, arguments);
    }

    subject.enhance(server);
    (new AppResponder()).enhance(server);

    clientSocket1 = server.emitClient();
    clientSocket2 = server.emitClient();
    workerSocket = server.emitClient();

    serverEvents.length = 0;
  });

  describe('initialization', function() {
    it('should set .currentId', function() {
      expect(subject.currentId).to.be(0);
    });

    it('should set .listeners', function() {
      expect(subject.listeners).to.eql({});
    });

    it('should set .capturedEvents', function() {
      expect(subject.capturedEvents).to.eql({});
    });
  });

  describe('event: mirror events add', function() {
    var client;

    function clientReceviesEvents(index) {
      var calls;
      beforeEach(function() {
        calls = client.sent;
      });

      it('should receive ack from server', function() {
        var ack = {
          id: index,
          events: ['foo', 'bar']
        };

        expect(calls[0].event).to.eql('mirror events ack');
        expect(calls[0].data).to.eql(ack);
      });

      it('should receive foo event', function() {
        expect(calls[1]).to.eql(
          { event: 'foo', data: 1 }
        );
      });

      it('should receive bar event', function() {
        expect(calls[2]).to.eql(
          { event: 'bar', data: 2 }
        );
      });
    }

    function emitsToClient(capture) {
      it('should not send events to worker', function() {
        expect(workerSocket.sent.length).to.be(0);
      });

      describe('in first client', function() {
        beforeEach(function() {
          client = clientSocket1;
        });

        clientReceviesEvents(0);
      });

      describe('in second client', function() {
        beforeEach(function() {
          client = clientSocket2;
        });

        if (capture) {
          it('should not send events to the second client', function() {
            expect(client.sent.length).to.be(1);
          });
        } else {
          clientReceviesEvents(1);
        }
      });
    }

    describe('when type is capture', function() {
      mirrorEvents(true);

      beforeEach(function() {
        sendWorkerEvents();
      });

      it('should not trigger server events while captured', function() {
        expect(serverEvents.length).to.be(2);
      });

      emitsToClient(true);
    });

    describe('when type is mirror', function() {
      mirrorEvents();

      beforeEach(function() {
        sendWorkerEvents();
      });

      it('should not supress server events', function() {
        expect(serverEvents.length).to.be(4);
      });

      emitsToClient();
    });
  });

  describe('event: websocket client close', function() {
    mirrorEvents();

    beforeEach(function() {
      clientSocket1.emit('close');
    });

    it('should remove listener for client 1', function() {
      expect(subject.listeners[0]).not.to.be.ok();
    });

    it('should remove listener reference for foo', function() {
      expect(subject.capturedEvents.foo).to.eql([1]);
    });

    it('should remove listener reference for bar', function() {
      expect(subject.capturedEvents.bar).to.eql([1]);
    });
  });

  describe('event: mirror events remove', function() {

    describe('after removing all listeners on socket 1', function() {
      mirrorEvents();

      beforeEach(function() {
        clientSocket1.emit('message',
          server.stringify(
            'mirror events remove',
            { id: 0, events: ['bar', 'foo'] }
          )
        );
      });

      it('should remove listener for client 1', function() {
        expect(subject.listeners[0]).not.to.be.ok();
      });

      it('should remove listener reference for foo', function() {
        expect(subject.capturedEvents.foo).to.eql([1]);
      });

      it('should remove listener reference for bar', function() {
        expect(subject.capturedEvents.bar).to.eql([1]);
      });
    });

    describe('after removing bar listener on socket 2', function() {
      mirrorEvents();

      beforeEach(function() {
        clientSocket2.emit('message',
          server.stringify('mirror events remove', { id: 1, events: ['bar'] })
        );
        sendWorkerEvents();
      });

      it('should not receive bar events', function() {
        var calls = clientSocket2.sent;
        expect(calls.length).to.be(2);
        expect(calls[0].event).to.be('mirror events ack');
        expect(calls[1].event).to.be('foo');
      });

      it('should remove id from events list', function() {
        expect(subject.capturedEvents.bar).to.eql([0]);
      });

      it('should not effect the capturedEvents list for client1', function() {
        expect(subject.capturedEvents.foo).to.eql([0, 1]);
      });

      it('should not effect other clients', function() {
        expect(clientSocket1.sent.length).to.be(3);
      });
    });

  });

});
