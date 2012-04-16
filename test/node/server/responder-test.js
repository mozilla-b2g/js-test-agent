var Responder = require_lib('node/server/responder');

describe("node/server/responder", function(){
  var factory = require('../factory/websocket-server'),
      server, subject;

  beforeEach(function(){
    server = factory.websocketServer();
    subject = new Responder();

    subject.enhance(server);
  });

  describe("when server recieves a message", function(){
    var socket, calledWith, data = ['test', {event: true}];

    beforeEach(function(){
      calledWith = [];
      //primes server
      socket = server.emitClient();
      server.respond = function(){
        calledWith.push(arguments);
      };

      socket.emit('message', data);
    });

    it("should respond to message from socket", function(){
      expect(calledWith[0]).to.eql([data, socket]);
    });

  });

});
