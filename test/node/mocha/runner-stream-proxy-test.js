var Responder = require('../../../lib/test-agent/responder').TestAgent.Responder,
    RunnerProxy = require('../../../lib/node/mocha/runner-stream-proxy');

describe('node/mocha/runner-stream-proxy', function() {
  var subject, runner, event, test,
      eventsFired, factory = {};

  factory.test = testSupport.factory({
    fullTitle: 'Parent: Foo Bar',
    title: 'Foo bar',
    state: 'passed',
    testAgentEnvId: null
  }, RunnerProxy.Test);

  factory.suite = testSupport.factory({
    title: 'title',
    fullTitle: 'full',
    testAgentEnvId: null
  }, RunnerProxy.Suite);

  function lastEvent() {
    if (eventsFired.length === 0) {
      return false;
    }
    return eventsFired[eventsFired.length - 1];
  }

  function prependsTestAgentEnv(type) {
    describe('with testAgentEnvId', function() {
      var subject,
          attrs;

      beforeEach(function() {
        attrs = factory[type].attrs();
        subject = factory[type]({
          testAgentEnvId: 'ie7'
        });
        console.log(subject.testAgentEnvId);
      });

      it('should prefix title', function() {
        if (attrs.title) {
          expect(subject.title).to.be('[ie7] ' + attrs.title);
        }
      });

      it('should prefix fullTitle', function() {
        console.log(subject.fullTitle, '<-- full title');
        var fullTitle = subject.fullTitle();
        expect(fullTitle).to.be('[ie7] ' + attrs.fullTitle);
      });
    });
  }

  describe('.Test', function() {

    it('should add a function .fullTitle which returns the string value of fullTitle', function() {
      var title = 'zomg it works!',
          subject = factory.test({
            fullTitle: title
          });

      expect(subject.fullTitle()).to.equal(title);
    });

    prependsTestAgentEnv('test');

  });

  describe('.Suite', function() {
    var subject;

    prependsTestAgentEnv('suite');

    beforeEach(function() {
      subject = factory.suite({ title: 'foo', fullTitle: 'foo' });
    });

    it('should provide mirror for given properties', function() {
      expect(subject.title).to.be('foo');
    });

    describe('.fullTitle', function() {
      it('should be a function', function() {
        expect(subject.fullTitle()).to.be('foo');
      });
    });

  });

  beforeEach(function() {
    var emit;

    runner = new Responder();
    subject = new RunnerProxy(runner);

    emit = runner.emit;

    runner.emit = function() {
      eventsFired.push(Array.prototype.slice.call(arguments));
      emit.apply(runner, arguments);
    };

    eventsFired = [];
  });

  it('should be an instanceof Responder', function() {
    expect(subject).to.be.a(Responder);
  });

  describe('initialization', function() {

    it('should store runner', function() {
      expect(subject.runner).to.be(runner);
    });

  });

  describe('event: start', function() {
    var data;

    beforeEach(function() {
      data = {total: 20};

      subject.respond(['start', data]);
    });

    it('should set .total on runner to 20', function() {
      expect(runner.total).to.be(data.total);
    });

    it('should emit an event on runner', function() {
      var event = lastEvent();

      expect(event[0]).to.be('start');
      expect(event[1]).to.eql(data);
    });

  });

  describe('event: end', function() {
    var data;

    beforeEach(function() {
      subject.respond(['end', data]);
    });

    it('should emit an event on runner', function() {
      var event = lastEvent();

      expect(event[0]).to.be('end');
      expect(event[1]).to.eql(data);
    });

  });


  describe('event: suite', function() {
    var suite;

    beforeEach(function() {
      suite = factory.suite.attrs();
      subject.respond(['suite', suite]);
    });

    it('should stage .parent', function() {
      expect(subject.parent).to.be.a(RunnerProxy.Suite);
      expect(subject.parent.fullTitle()).to.eql(suite.fullTitle);
    });

    it('should emit an event', function() {
      var event = eventsFired[0];
      expect(event[0]).to.be('suite');
      expect(event[1]).to.be.a(RunnerProxy.Suite);
    });

    describe('event: suite end', function() {
      beforeEach(function() {
        expect(subject.parent).to.be.ok();

        subject.respond(['suite end', suite]);
      });

      it('should clear .parent', function() {
        expect(subject.parent).not.to.be.ok();
      });
    });

  });

  describe('event: test / test end', function() {
    var suite, test, event;

    beforeEach(function() {
      subject.err = 'something';
      suite = subject.parent = factory.suite();
      test = factory.test.attrs({ title: 'fooz' });
    });

    function testEvent(eventType) {
      beforeEach(function() {
        subject.respond([eventType, test]);
      });

      it('should have .parent attribute', function() {
        expect(subject.parent).to.be(suite);
      });

      it('should fire test event on runner', function() {
        var event = lastEvent();
        expect(event[0]).to.be(eventType);
        expect(event[1].title).to.eql(test.title);
      });

    }

    describe('event: test', function() {
      testEvent('test');

      it('should retain .err', function() {
        expect(subject.err).not.to.be.ok();
      });
    });

    describe('event: test end', function() {

      beforeEach(function() {
        subject.err = 'err!';
      });

      it('should remove .err', function() {
        expect(subject.err).to.be.ok();
      });

      it('should attach error to event', function() {
        var event = lastEvent();
        expect(event[1].err).to.eql('err!');
      });

      testEvent('test end');
    });

  });

  describe('event: fail', function() {
    var err;

    beforeEach(function() {
      err = 'something';

      test = factory.test.attrs({
        err: err
      });

      subject.respond(['fail', test]);
      event = lastEvent();
    });

    it('should fire event on runner', function() {
      expect(event[0]).to.be('fail');
      expect(event[1].title).to.eql(test.title);
      expect(event[1]).be.a(RunnerProxy.Test);
      expect(event[2]).to.eql(err);
    });

    it('should save the error', function() {
      expect(subject.err).to.be(err);
    });
  });

  describe('event: pass', function() {
    var event;

    beforeEach(function() {
      test = factory.test.attrs();
      subject.respond(['pass', test]);
      event = lastEvent();
    });

    it('should fire event on runner', function() {
      expect(event[0]).to.be('pass');
      expect(event[1].title).to.eql(test.title);
      expect(event[1]).be.a(RunnerProxy.Test);
    });

  });

  describe('event: pending', function() {
    var event;

    beforeEach(function() {
      test = factory.test.attrs();
      subject.respond(['pending', test]);
      event = lastEvent();
    });

    it('should fire event on runner', function() {
      expect(event[0]).to.be('pending');
      expect(event[1].title).to.eql(test.title);
      expect(event[1]).be.a(RunnerProxy.Test);
    });

  });


});
