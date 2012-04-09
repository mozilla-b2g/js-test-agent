var Server = require('../../lib/node/websocket-server'),
    Responder = require('../../lib/test-agent/responder').TestAgent.Responder,
    fsPath = require('path');

describe("node/websocket-server", function(){
  var subject;

  beforeEach(function(){
    subject = new Server();
  });

  describe("initialization", function(){
    it("should have a .implementation", function(){
      expect(subject.implementation).to.be(require('websocket.io'));
    });

    it("should have a responder", function(){
      expect(subject.responder).to.be.a(Responder);
    });

    it("should have no socket by default", function(){
      expect(subject.socket).not.to.be.ok();
    });

  });

  describe("._createSandbox", function(){

    var result,
        dir = __dirname + '/',
        file = dir + 'js-test-agent.js';

    beforeEach(function(){
      result = subject._createSandbox(file);
    });

    it("should have a require method", function(){
      //is really require
      expect(result.require && result.require.cache).to.be.ok();
    });

    it("should expose process.argv, server", function(){
      //note require cannot be evaulated via === so I remove it here
      delete result.require;
      expect(result).to.eql({
        server: subject,
        argv: process.argv,
        console: console,
        __file: file,
        __dirname: fsPath.dirname(file)
      });
    });
  });

  describe(".expose", function(){
    var file = __dirname + '/js-test-agent.js';

    beforeEach(function(done){
      subject.expose(file, function(){
        done();
      });
    });

    it("should have modified subject", function(){
      expect(subject.wasConfigured).to.be(true);
    });
  });

  describe(".listen", function(){

    var server = {},
        calledWith = [],
        result,
        listen;

    beforeEach(function(){
      calledWith = [];
      listen = subject.implementation.listen;
      subject.implementation.listen = function(){
        calledWith.push(Array.prototype.slice.call(arguments));
        return server;
      };

      result = subject._delegate('listen', 877);
    });

    afterEach(function(){
      subject.implementation.listen = listen;
    });

    it("should return result", function(){
      expect(result).to.be(server);
    });

    it("should pass arguments to implementation", function(){
      expect(calledWith[0][0]).to.be(877);
    });

  });

  describe("delegated methods", function(){
    var calledWith, uniq = {};

    function delegates(method){
      var delegate, result;

      beforeEach(function(){
        calledWith = [];
        subject._delegate = function(){
          calledWith.push(arguments);
          return uniq;
        };
      });

      beforeEach(function(){
        result = subject[method](777);
      });

      it("should save result to .socket", function(){
        expect(subject.socket).to.be(uniq);
      });

      it("should return result", function(){
        expect(result).to.be(uniq);
      });

      it("should pass argumets to _delegate", function(){
        expect(calledWith[0][0]).to.be(method);
        expect(calledWith[0][1]).to.be(777);
      });

    }

    describe(".listen", function(){
      delegates('listen');
    });

    describe(".attach", function(){
      delegates('attach');
    });


  });

});
