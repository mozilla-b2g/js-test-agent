var PoolBase = require('../../lib/test-agent/pool-base').TestAgent.PoolBase,
    WebSocketPool = require('../../lib/node/websocket-pool');

describe("node/websocket-pool", function(){

  var socket, key, subject, sendCalled = [];

  beforeEach(function(){
    subject = new WebSocketPool();
    sendCalled = [];
    key = 'fooz';

    socket = {
      req: {
        headers: {
          'sec-websocket-key': key
        }
      },
      send: function(){
        sendCalled.push(Array.prototype.slice.call(arguments));
      }
    };

  });

  it("should be a child of PoolBase", function(){
    expect(subject).to.be.a(PoolBase);
  });

  describe(".objectDetails", function(){
    var result;

    beforeEach(function(){
      result = subject.objectDetails(socket);
    });

    it("should return .key as sec-websocket-key header", function(){
      expect(result.key).to.be(key);
    });

    it("should return .value as socket", function(){
      expect(result.value).to.be(socket);
    });

  });

  describe(".checkObjectValue", function(){

    describe("when socket is destroyed", function(){
      beforeEach(function(){
        socket.socket = {destroyed: true};
      });

      it("should return false", function(){
        expect(subject.checkObjectValue(socket)).to.be(false);
      });
    });

    describe("when socket is not destroyed", function(){
      it("should return true", function(){
        expect(subject.checkObjectValue(socket)).to.be(true);
      });
    });
  });

  describe(".broadcast", function(){
    var message = 'msg';

    beforeEach(function(){
      subject.add(socket);
      subject.broadcast(message);
    });

    it("should call send on each .socket", function(){
      expect(sendCalled[0][0]).to.be(message);
    });

  });

});
