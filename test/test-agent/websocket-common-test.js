var result = require_lib('test-agent/websocket-common.js');

if(result){
  var TestAgent = result.TestAgent;
}

describe("websocket-common", function(){
  var WS, subject, cmd = 'command';

  before(function(){
    console.log(WS, TestAgent);
    WS = TestAgent.WebSocketCommon;
  });

  describe("WebSocketCommon", function(){

    var data = { foo: 'bar', baz: ['1', '2'] },
        commandString = cmd + ' : ' + JSON.stringify(data),
        actual;


    beforeEach(function(){
      subject = WS;
    });

    describe(".stringify", function(){

      beforeEach(function(){
        actual = subject.stringify(cmd, data);
      });

      it("should return string output -> command : json", function(){
        expect(actual).to.be(commandString);
      });

    });

    describe(".parse", function(){

      beforeEach(function(){
        actual = subject.parse(commandString);
      });

      it("should be an object", function(){
        expect(actual).to.be.a(Object);
      });

      it("should have a .command property with comandName", function(){
        expect(actual.command).to.be(cmd);
      });

      it("should have a .data property with data", function(){
        expect(actual.data).to.eql(data);
      });

    });

  });


});
