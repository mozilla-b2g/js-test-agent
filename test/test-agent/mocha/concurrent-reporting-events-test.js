describe('test-agent/mocha/concurrent-reporting-events', function() {

  var subject,
      eventStack = [],
      ReportingEvents,
      Responder,
      Proxy;

  cross.require(
    'test-agent/responder',
    'TestAgent.Responder', function(obj) {
      Responder = obj;
    }
  );

  cross.require(
    'test-agent/mocha/concurrent-reporting-events',
    'TestAgent.Mocha.ConcurrentReportingEvents', function(obj) {
      ReportingEvents = obj;
    }
  );

  cross.require(
    'test-agent/mocha/runner-stream-proxy',
    'TestAgent.Mocha.RunnerStreamProxy', function(obj) {
      Proxy = obj;
    }
  );

  function emit(event, id) {
    var data = { testAgentEnvId: id };
    subject.emit(event, data);
  }

  function emitStart(id) {
    subject.emit('start', {
      testAgentEnvId: id,
      total: 1
    });
  }

  function emitTest(id) {
    emit('test', id);
  }

  function emitEnd(id) {
    emit('end', id);
  }

  function shouldEmit(index, event, id) {
    var stack = eventStack[index];
    expect(stack[0]).to.eql(event);
    expect(stack[1].testAgentEnvId).to.eql(id);
  }

  beforeEach(function() {
    eventStack.length = 0;
    subject = new ReportingEvents({
      envs: ['a', 'b']
    });

    //make it lower so we can find timing errors.
    subject.envTimeout = 1000;

    ['start', 'end', 'test'].forEach(function(event) {
      subject.on(event, function() {
        var args = Array.prototype.slice.call(arguments);
        args.unshift(event);
        eventStack.push(args);
      });
    });
  });

  describe('.emitStart', function() {

    it('should emit start with total', function(done) {
      subject.total = 5;
      subject.on('start', function(data) {
        expect(data.total).to.eql(5);
        done();
      });

      subject.emitStart();
    });

  });

  describe('.emit', function() {
    it('should work like normal without ids', function(done) {
      subject.on('my thing', function() {
        expect(arguments[0]).to.be('foo');
        done();
      });

      subject.emit('my thing', 'foo');
    });
  });

  describe('initialization', function() {

    it('should be a responder', function() {
      expect(subject).to.be.a(Responder);
    });

    it('should create list in env queue', function() {
      expect(subject.envQueue).to.eql({});
    });

    it('should have start queue', function() {
      expect(subject.startQueue).to.eql(['a', 'b']);
    });

    it('should not have a current env', function() {
      expect(subject.currentEnv).to.not.be.ok();
    });
  });

  describe('starting', function() {

    describe('when second emit start never occurs', function() {
      it('should trigger an error', function(done) {
        this.timeout(500);
        subject.envTimeout = 250;

        subject.on('runner error', function() {
          expect(arguments[0]).to.be.a(Error);
          done();
        });

        emitStart('a');
      });
    });

    describe('when successfully starting', function() {
      var calledWith;

      beforeEach(function(done) {
        calledWith = null;

        subject.on('start', function() {
          calledWith = arguments;
          done();
        });

        emitStart('a');
        emitStart('b');
      });

      it('should emit a start event with the sum total', function() {
        expect(calledWith[0].total).to.eql(2);
      });
    });
  });

  describe('starting and ending', function() {

    it('should emit start & endy once', function() {
      expect(subject.startQueue).to.eql([
        'a',
        'b'
      ]);

      emitStart('a');

      expect(subject.startQueue).to.eql(['b']);
      expect(subject.currentEnv).not.to.be.ok();

      emitStart('b');

      expect(subject.startQueue).to.eql([]);
      expect(subject.currentEnv).be('a');

      emitEnd('b');
      emitEnd('a');

      expect(eventStack.length).to.be(2);
      shouldEmit(1, 'end', 'b');
    });
  });

  describe('when env: a never finishes', function() {
    var calledWith;

    beforeEach(function(done) {
      this.timeout(500);

      subject.envTimeout = 250;
      subject.on('runner error', function() {
        calledWith = arguments;
        done();
      });

      emitStart('b');
      emitEnd('b');
    });

    it('should timeout', function() {
      expect(calledWith[0]).to.be.a(Error);
    });
  });

  describe('when a is current', function() {
    beforeEach(function() {
      emitStart('a');
      emitStart('b');
      emitTest('a');
      emitTest('a');
      emitTest('b');
    });

    afterEach(function() {
      //clear timeout
      emitEnd('b');
      emitEnd('a');
    });

    it('should be marked as active', function() {
      expect(subject.currentEnv).to.be('a');
    });

    it('should emit only a events', function() {
      expect(eventStack.length).to.be(3);
      shouldEmit(0, 'start');
      shouldEmit(1, 'test', 'a');
      shouldEmit(2, 'test', 'a');
    });

    describe('when a finishes', function() {
      beforeEach(function() {
        eventStack.length = 0;
        emitEnd('a');
      });

      it('should set b a current', function() {
        expect(subject.currentEnv).to.be('b');
      });

      it('should emit queued b events', function() {
        expect(eventStack.length).to.be(1);
        shouldEmit(0, 'test', 'b');
      });

      it('should emit end event when b ends', function() {
        emitEnd('b');
        shouldEmit(1, 'end', 'b');
      });
    });

  });


});
