var result = require_lib('test-agent/responder.js');

if (result) {
  var TestAgent = result.TestAgent;
}

describe('test-agent/responder', function() {
  var Responder, subject, eventName = 'test';

  before(function() {
    Responder = TestAgent.Responder;
  });

  describe('Static Methods', function() {

    var data = { foo: 'bar', baz: ['1', '2'] },
        commandString,
        actual;


    beforeEach(function() {
      subject = TestAgent.Responder;
      commandString = JSON.stringify([eventName, data]);
    });

    describe('.stringify', function() {

      beforeEach(function() {
        actual = subject.stringify(eventName, data);
      });

      it('should return json output of [command, data]', function() {
        expect(actual).to.be(commandString);
      });

    });

    describe('.parse', function() {

      var result;

      function willReturnEvent() {
        it('should be an object', function() {
          expect(result).to.be.a(Object);
        });

        it('should have a .event property with comandName', function() {
          expect(result.event).to.be(eventName);
        });

        it('should have a .data property with data', function() {
          expect(result.data).to.eql(data);
        });
      }

      describe('when given a string', function() {
        beforeEach(function() {
          result = subject.parse(commandString);
        });

        willReturnEvent();
      });

      describe('when given an array', function() {
        beforeEach(function() {
          result = subject.parse([eventName, data]);
        });

        willReturnEvent();
      });

      describe('when given an invalid string', function() {

        it('should throw an error', function() {
          var str = 'fooz:bar!';
          expect(function() {
            subject.parse(str);
          }).to.throwError(str);
        });

      });

    });

  });

  describe('Responder instance', function() {

    beforeEach(function() {
      subject = new Responder();
    });

    describe('.parse', function() {
      it('should be the same function as static', function() {
        expect(subject.parse).to.be(Responder.parse);
      });
    });

    describe('.stringify', function() {
      it('should be the same function as static', function() {
        expect(subject.stringify).to.be(Responder.stringify);
      });
    });

    describe('initialization', function() {

      it('should set events to a blank object', function() {
        expect(subject.events).to.eql({});
      });

      describe('when given an object', function() {
        var calledWith, events;

        beforeEach(function() {
          subject.addEventListener = function() {
            calledWith = arguments[0];
          };

          events = {
            'stuff': function() {}
          };

          Responder.call(subject, events);
        });

        it('should call .addEventListener with events', function() {
          expect(calledWith).to.be(events);
        });

      });

    });

    describe('.respond', function() {
      var data = {works: true},
          event,
          cb;

      beforeEach(function() {
        event = Responder.stringify('attack', data);
        cb = function() {
          cb.called = true;
          cb.calledWith = Array.prototype.slice.call(arguments);
        };

        subject.on('attack', cb);
        subject.respond(event, 'extra');
      });

      it('should fire attack', function() {
        expect(cb.called).to.be(true);
      });

      it('should pass data, event as arguments', function() {
        expect(cb.calledWith).to.eql([data, 'extra']);
      });
    });


    describe('.addEventListener', function() {

      describe('when given an object', function() {
        var cb1 = function() {},
            cb2 = function() {};

        beforeEach(function() {
          subject.addEventListener({
            'client new': cb1,
            'test all': cb2
          });
        });

        it('should add event for each key(event),value(callback) pair', function() {
          expect(subject.events['client new'][0]).to.be(cb1);
          expect(subject.events['test all'][0]).to.be(cb2);
        });

      });

      describe('when given a type and callback', function() {
        var cb1, cb2, events;

        beforeEach(function() {
          cb1 = function() {};
          cb2 = function() {};

          subject.addEventListener('test', cb1);
          subject.addEventListener('test', cb2);
          events = subject.events;
        });

        it('should create an array for events.test', function() {
          expect(subject.events.test).to.be.a(Array);
        });

        it('should add callback1 to test events.test', function() {
          expect(events.test[0]).to.be(cb1);
        });

        it('should add callback2 to test events.test', function() {
          expect(events.test[1]).to.be(cb2);
        });
      });

    });

    describe('.on', function() {
      it('should be the same function as addEventListener', function() {
        expect(subject.on).to.be(subject.addEventListener);
      });
    });

    describe('.once', function() {
      var timesCalled, calledWith;

      function onceCb() {
        timesCalled += 1;
        calledWith = arguments;
      }

      beforeEach(function() {
        timesCalled = 0;
        subject.once('onceEvent', onceCb);

        subject.emit('onceEvent', '1', '2');
        subject.emit('onceEvent', '3', '4');
        subject.emit('onceEvent', '5', '6');
      });

      it('should only hear one event fired', function() {
        expect(timesCalled).to.be(1);
      });

      it('should pass arguments', function() {
        expect(calledWith).to.eql(['1', '2']);
      });

      it('should remove event after firing', function() {
        expect(subject.events.onceEvent.length).to.be(0);
      });

    });

    describe('.emit', function() {

      var calledArguments, calledScope, timesCalled,
          cb1, cb2;

      beforeEach(function() {
        timesCalled = 0;
        calledArguments = null;
        calledScope = null;

        cb1 = function() {
          timesCalled += 1;
          calledArguments = Array.prototype.slice.call(arguments);
          calledScope = this;
          cb1.called = true;
        };

        cb2 = function() {
          timesCalled += 1;
          cb2.called = true;
        };

        subject.on('test', cb1);
        subject.on('test', cb2);

        subject.emit('test', 'foo', 'bar');
      });

      it('should have invoked each listener', function() {
        expect(cb1.called).to.be(true);
        expect(cb2.called).to.be(true);
      });

      it('should have called each listener once', function() {
        //once for each listener
        expect(timesCalled).to.be(2);
      });

      it('should not fail when invoking event with no listeners', function() {
        subject.emit('foobar', 1);
      });

      it('should invoke callbacks with scope of class', function() {
        expect(calledScope).to.be(subject);
      });

      it('should invoke callbacks with given arguments', function() {
        expect(calledArguments).to.eql(['foo', 'bar']);
      });
    });

    describe('.removeEventListener', function() {
      it('should have no events', function() {
        expect(subject.events.test).to.be(undefined);
      });

      describe('when there are no listeners to remove', function() {
        it('should not fail', function() {
          subject.removeEventListener('test', function() {});
        });
      });

      describe('when listener is not found', function() {

        beforeEach(function() {
          subject.on('test', function() {});

          subject.removeEventListener('test', function() {});
        });

        it('should not remove any other event', function() {
          expect(subject.events.test.length).to.be(1);
        });

      });

      describe('when a listener is found', function() {

        var cb1 = function() {},
            cb2 = function() {};

        beforeEach(function() {
          subject.addEventListener('test', cb1);
          subject.addEventListener('test', cb1);
          subject.addEventListener('test', cb2);

          expect(subject.events.test.length).to.be(3);

          subject.removeEventListener('test', cb1);
        });


        //this is how it works in node anyway
        it('should have removed one instance of removed callback', function() {
          expect(subject.events.test.length).to.be(2);

          //will have new index order
          expect(subject.events.test[0]).to.be(cb1);
          expect(subject.events.test[1]).to.be(cb2);
        });

      });

    });

    describe('.removeAllEventListeners', function() {

      describe('when there are event listeners', function() {

        beforeEach(function() {
          subject.on('test', function() {});
          subject.removeAllEventListeners('test');
        });

        it('should have no events', function() {
          expect(subject.events.test.length).to.be(0);
        });
      });

      describe('when there are no listeners', function() {

        it('should not fail', function() {
          subject.removeAllEventListeners('test');
        });

      });

    });

  });


});


