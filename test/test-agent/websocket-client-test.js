var Responder = require_lib('test-agent/responder.js'),
    WebsocketClient = require_lib('test-agent/websocket-client.js');

if(WebsocketClient){
  var WebsocketClient = WebsocketClient.TestAgent.WebsocketClient;
}

if(Responder){
  Responder = Responder.TestAgent.Responder;
}

describe("test-agent/websocket-common", function(){
  var subject, url = 'ws://fake', Native;

  function mockNative(){
    beforeEach(function(){

      Native = function(url){
        this.url = url;
        Responder.call(this);
      };

      Native.prototype = Object.create(Responder.prototype);
      subject.Native = Native;
    });
  }

  beforeEach(function(){
    Responder = Responder || TestAgent.Responder;
    WebsocketClient = WebsocketClient || TestAgent.WebsocketClient;
  });

  beforeEach(function(){
    subject = new WebsocketClient({
      url: url
    });
  });

  describe("initialization", function(){
    it("should save url", function(){
      expect(subject.url).to.be(url);
    });

    it("should be a responder", function(){
      expect(subject).to.be.a(Responder);
    });
  });

  describe(".Native", function(){

    it("should exist", function(){
      expect(subject.Native).to.be.ok();
    });

    it("should respond to .addEventListener", function(){
      expect(subject.Native.prototype.addEventListener).to.be.a(Function);
    });
  });

  describe(".start", function(){
    mockNative();

    var eventFired;

    beforeEach(function(){
      eventFired = false;
      subject.on('start', function(){
        eventFired = true;
      });
      subject.start();
    });

    it("should fire start event", function(){
      expect(eventFired).to.be(true);
    });

    it("should create an instance of Native in .socket", function(){
      expect(subject.socket).to.be.a(subject.Native);
    });

    it("should setup .native instance with url", function(){
      expect(subject.socket.url).to.be(url);
    });

  });

  describe("event proxies", function(){
    mockNative();

    function proxysEvent(event){
      var savedArgs, sentArg;

      describe('event: ' + event, function(){
        beforeEach(function(){
          savedArgs = [];
          sentArg = Responder.stringify('test event', {data: 1});

          subject.start();

          subject.on(event, function(){
            savedArgs.push(arguments);
          });

          //emit is safe here only because its mocked
          subject.socket.emit(event, sentArg);
        });

        it("should emit proxied event", function(){
          expect(savedArgs[0][0]).to.eql(sentArg);
        });
      });
    }

    proxysEvent('open');
    proxysEvent('close');
    proxysEvent('message');
  });

  describe(".send", function(){
    var sent, eventData, data = ['client event', {data: 1}];
    beforeEach(function(){

      eventData = Responder.stringify(data[0], data[1]);

      sent = null;
      subject.start();
      subject.socket.send = function(data){
        sent = data;
      };

      subject.send(data[0], data[1]);
    });

    it("should send stringified event to socket", function(){
      expect(sent).to.equal(eventData);
    });

  });

  describe("event: message", function(){
    var data = ['server event', {data: true}],
        eventData;

    beforeEach(function(){
      eventData = null;
      subject.on('server event', function(){
        eventData = arguments;
      });

      subject.emit('message', Responder.stringify(data[0], data[1]));
    });

    it("should process messages into events", function(){
      expect(eventData[0]).to.eql(data[1]);
    });
  });

  describe("retries", function(){

    beforeEach(function(){
      subject.retry = true;
    });

    describe("when retry initially fails", function(){

      it("should increment retries then call start", function(done){
        subject.retryLimit = 5;
        subject.retryTimeout = 10;

        subject.on('close', function(){
          expect(subject.retries).to.be(1);
          //prevent loops
          subject.removeAllEventListeners('close');
        });

        subject.start();
        subject.emit('close');

        subject.on('start', function(){
          done();
        });
      });
    });

    describe("when there are retries but connection eventually opens", function(){
      beforeEach(function(){
        subject.retries = 10;
        subject.emit('open');
      });

      it("should reset retries to 0", function(){
        expect(subject.retries).to.be(0);
      });
    });

    describe("when retries run out", function(){
      it("should throw error", function(){
        subject.retryLimit = 0;

        expect(function(){
          subject.start();
        }).to.throwError(WebsocketClient.RetryError);
      });
    });

  });

});
