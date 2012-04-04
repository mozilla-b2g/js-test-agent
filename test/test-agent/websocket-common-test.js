var result = require_lib('test-agent/websocket-common.js');

if(result){
  var TestAgent = result.TestAgent;
}

describe("websocket-common", function(){
  var WS, subject, cmd = 'command';

  before(function(){
    WS = TestAgent.WebSocketCommon;
  });

  describe("WebSocketCommon", function(){

    var data = { foo: 'bar', baz: ['1', '2'] },
        commandString = cmd + ':' + JSON.stringify(data),
        actual;


    beforeEach(function(){
      subject = WS;
    });

    describe(".stringify", function(){

      beforeEach(function(){
        actual = subject.stringify(cmd, data);
      });

      it("should return string output -> command:json", function(){
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

  describe("WebSocketCommon.Responder", function(){

    beforeEach(function(){
      subject = new WS.Responder();
    });

    describe("initialization", function(){
      it("should set events to a blank object", function(){
        expect(subject.events).to.eql({});
      });
    });

    describe(".receive", function(){
      var data = {works: true},
          event,
          cb;

      beforeEach(function(){
        event = WS.stringify('attack', data);
        cb = function(){
          cb.called = true;
          cb.calledWith = Array.prototype.slice.call(arguments);
        };

        subject.on('command:attack', cb);

        subject.receive(event);
      });

      it("should fire command:attack", function(){
        expect(cb.called).to.be(true);
      });

      it("should pass data, event as arguments", function(){
        expect(cb.calledWith).to.eql([data, 'attack']);
      });
    });


    describe(".addEventListener", function(){

      var cb1, cb2, events;

      beforeEach(function(){
        cb1 = function(){};
        cb2 = function(){};

        subject.addEventListener('test', cb1);
        subject.addEventListener('test', cb2);
        events = subject.events;
      });
      it("should create an array for events.test", function(){
        expect(subject.events.test).to.be.a(Array);
      });

      it("should add callback1 to test events.test", function(){
        expect(events.test[0]).to.be(cb1);
      });

      it("should add callback2 to test events.test", function(){
        expect(events.test[1]).to.be(cb2);
      });

    });

    describe(".on", function(){
      it("should be the same function as addEventListener", function(){
        expect(subject.on).to.be(subject.addEventListener);
      });
    });

    describe(".emit", function(){

      var calledArguments, calledScope, timesCalled,
          cb1, cb2;

      beforeEach(function(){
        timesCalled = 0;
        calledArguments = null;
        calledScope = null;

        cb1 = function(){
          timesCalled += 1;
          calledArguments = Array.prototype.slice.call(arguments);
          calledScope = this;
          cb1.called = true;
        };

        cb2 = function(){
          timesCalled += 1;
          cb2.called = true;
        };

        subject.on('test', cb1);
        subject.on('test', cb2);

        subject.emit('test', 'foo', 'bar');
      });

      it("should have invoked each listener", function(){
        expect(cb1.called).to.be(true);
        expect(cb2.called).to.be(true);
      });

      it("should have called each listener once", function(){
        //once for each listener
        expect(timesCalled).to.be(2);
      });

      it("should not fail when invoking event with no listeners", function(){
        subject.emit('foobar', 1);
      });

      it("should invoke callbacks with scope of class", function(){
        expect(calledScope).to.be(subject);
      });

      it("should invoke callbacks with given arguments", function(){
        expect(calledArguments).to.eql(['foo', 'bar']);
      });
    });

    describe(".removeEventListener", function(){
      it("should have no events", function(){
        expect(subject.events.test).to.be(undefined);
      });

      describe("when there are no listeners to remove", function(){
        it("should not fail", function(){
          subject.removeEventListener('test', function(){});
        });
      });

      describe("when listener is not found", function(){

        beforeEach(function(){
          subject.on('test', function(){});

          subject.removeEventListener('test', function(){});
        });

        it("should not remove any other event", function(){
          expect(subject.events.test.length).to.be(1);
        });

      });

      describe("when a listener is found", function(){

        var cb1 = function(){},
            cb2 = function(){};

        beforeEach(function(){
          subject.addEventListener('test', cb1);
          subject.addEventListener('test', cb1);
          subject.addEventListener('test', cb2);

          expect(subject.events.test.length).to.be(3);

          subject.removeEventListener('test', cb1);
        });


        //this is how it works in node anyway
        it("should have removed one instance of removed callback", function(){
          expect(subject.events.test.length).to.be(2);

          //will have new index order
          expect(subject.events.test[0]).to.be(cb1);
          expect(subject.events.test[1]).to.be(cb2);
        });

      });

    });

    describe(".removeAllEventListeners", function(){

      describe("when there are event listeners", function(){

        beforeEach(function(){
          subject.on('test', function(){});
          subject.removeAllEventListeners('test');
        });

        it("should have no events", function(){
          expect(subject.events.test.length).to.be(0);
        });
      });

      describe("when there are no listeners", function(){

        it("should not fail", function(){
          subject.removeAllEventListeners('test');
        });

      });

    });

  });


});

