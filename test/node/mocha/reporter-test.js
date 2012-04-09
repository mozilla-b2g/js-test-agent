var Responder = require('../../../lib/test-agent/responder').TestAgent.Responder,
    Reporter = require('../../../lib/node/mocha/reporter');

describe("node/mocha/reporter", function(){

  var subject, report;

  beforeEach(function(){
    report = Responder;
    subject = new Reporter(report);
  });

  describe("initialization", function(){
    it("should create a .runner", function(){
      expect(subject.runner).to.be.a(Responder);
    });

    it("should create a .proxy", function(){
      expect(subject.proxy).to.be.a(Responder);
    });

    it("should create a .reporter", function(){
      expect(subject.reporter).to.be.a(Responder);
    });
  });

  describe(".respond", function(){
    var respond, calledWith = [];

    beforeEach(function(){
      calledWith = [];
      respond = subject.proxy.respond;
      subject.proxy.respond = function(){
        calledWith.push(Array.prototype.slice.call(arguments));
        respond.apply(this, arguments);
      };
    });

    it("should call proxy", function(){
      var data = ['foo', {}];
      subject.respond(data);

      expect(calledWith[0][0]).to.be(data);
    });

  });

});
