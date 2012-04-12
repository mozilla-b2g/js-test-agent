var Broadcast = require('../../../lib/node/server/broadcast'),
    Responder = require('../../../lib/test-agent/responder').TestAgent.Responder;

describe("node/server/broadcast", function(){

  var subject, server, connectionSocket,
      factory = require('../factory/websocket');

  beforeEach(function(){
    server = {
      socket: new Responder(),
      responder: new Responder()
    };

    connectionSocket = new Responder();
    subject = new Broadcast();

    subject.enhance(server);
  });

  describe(".broadcast", function(){
    var calledWith = [];

    beforeEach(function(){
      calledWith = [];
      subject.pool.broadcast = function(){
        calledWith.push(arguments);
      };

      server.broadcast('test');
    });

    it("should delegate to .pool broadcast", function(){
      expect(calledWith[0][0]).to.be('test');
    });

  });

  describe("when a client connects", function(){

    var socket;

    beforeEach(function(){
      socket = factory.websocket();

      expect(subject.pool.has(socket)).to.be(false);

      server.socket.emit('connection', socket);
    });

    it("should add socket to pool", function(){
      expect(subject.pool.has(socket)).to.be(true);
    });

    describe("when a client 'closes'", function(){
      beforeEach(function(){
        socket.emit('close', socket);
      });

      it("should be removed from pool", function(){
        expect(subject.pool.has(socket)).to.be(false);
      });

    });

  });

});
