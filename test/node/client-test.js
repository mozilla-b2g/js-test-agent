var Responder = requireLib('test-agent/responder'),
    WebsocketClient = requireLib('test-agent/websocket-client'),
    Client = requireLib('node/client');

WebsocketClient = WebsocketClient.TestAgent.WebsocketClient;

describe('test-agent/websocket-common', function() {

  var subject,
      sent = [],
      url = 'ws://fake';

  function getSent(index) {
    return sent[index || 0];
  }

  beforeEach(function() {
    sent.length = 0;
    subject = new Client({
      url: url
    });

    subject.send = function() {
      sent.push(arguments);
    };
  });

  describe('initialization', function() {
    it('should be a websocket client', function() {
      expect(subject).to.be.a(WebsocketClient);
    });

    it('should save url', function() {
      expect(subject.url).to.be(url);
    });
  });

  describe('.mirrorServerEvents', function() {

    var events = ['a', 'b'];

    function capturesServerEvents() {
      beforeEach(function() {
        subject.emit(subject.eventNames.ack, {
          id: 10,
          events: events
        });
      });

      it('should receive ack message and store id', function() {
        expect(subject.mirrorAckId).to.eql(10);
      });
    }

    describe('when capturing', function() {
      beforeEach(function() {
        subject.mirrorServerEvents(events, true);
      });

      it('should send notice to capture', function() {
        expect(getSent()).to.eql([
          subject.eventNames.add,
          { events: events, capture: true }
        ]);
      });

      capturesServerEvents();
    });

    describe('without capture', function() {
      beforeEach(function() {
        subject.mirrorServerEvents(events);
      });

      it('should send notice to capture', function() {
        expect(getSent()).to.eql([
          subject.eventNames.add,
          { events: events, capture: false }
        ]);
      });

      capturesServerEvents();

    });
  });

});
