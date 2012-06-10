requireLib('test-agent/export-error.js');

describe('test-agent/export-error', function() {

  var stacks = {},
      time = '?time=1235555';

  stacks.firefox = [
    'initDomEvents@http://localhost:8789/test-agent.js:1766\n',
    'onConfig@http://localhost:8789/test-agent.js:1762\n',
    '@http://localhost:8789/test-agent.js:537\n',
    'emit@http://localhost:8789/test-agent.js' + time + ':536\n',
    '@http://localhost:8789/test-agent.js:1627\n',
    'onReadyStateChange@http://localhost:8789/test-agent.js:930\n',
    '@http://localhost:8789/test-agent.js:1766\n'
  ].join('');

  stacks.chrome = [
    'Error: user message\n',
    '    at Object.initDomEvents',
    '(http://localhost:8789/test-agent.js' + time + ':1767:15)\n',
    '    at Object.onConfig (http://localhost:8789/test-agent.js:1762:12)\n',
    '    at http://localhost:8789/test-agent.js:537:20\n',
    '    at Array.forEach (native)\n',
    '    at Object.emit (http://localhost:8789/test-agent.js:536:19)\n',
    '    at XMLHttpRequest.<anonymous>',
    ' (http://localhost:8789/test-agent.js:1627:16)\n',
    '    at XMLHttpRequest.onReadyStateChange [as onreadystatechange]  ',
    ' (http://localhost:8789/test-agent.js:930:22)\n'
  ].join('');

  function createError(type) {
    var err = {};
    err.message = 'user message';
    err.type = 'Error';
    err.constructor = {
      name: 'Error'
    };
    err.expected = 'expected';
    err.actual = 'actual';
    err.stack = stacks[type];
    err.uncaught = true;

    return err;
  }

  describe('.exportError', function() {

    var result, err;

    describe('when given an object', function() {

      beforeEach(function() {
        err = createError('firefox');
        result = TestAgent.exportError(err);
      });

      it('should create object from an error', function() {
        expect(result).to.eql({
          message: err.message,
          type: err.type,
          constructorName: err.constructor.name,
          expected: err.expected,
          actual: err.actual,
          stack: TestAgent.formatStack(err),
          uncaught: true
        });
      });


    });

    describe('when given a string', function() {

      beforeEach(function() {
        result = TestAgent.exportError('wtf');
      });

      it('should create object from an error', function() {
        expect(result).to.eql({
          message: 'wtf',
          type: 'Error',
          constructorName: 'String',
          expected: null,
          actual: null,
          stack: ''
        });
      });


    });

  });

  describe('.formatStack', function() {

    var output;

    describe('firefox', function() {
      beforeEach(function() {
        output = TestAgent.formatStack(
          createError('firefox')
        );
      });

      it('should look nice', function() {
        expect(output).to.be.ok();
        expect(output).to.contain(
          'user message'
        );
      });

      it('should not include ?time=xxx', function() {
        expect(output).not.to.contain(time);
      });

    });

    describe('chrome', function() {
      beforeEach(function() {
        output = TestAgent.formatStack(
          createError('chrome')
        );
      });

      it('should not include ?time=xxx', function() {
        expect(output).not.to.contain(time);
      });

      it('should look nice', function() {
        expect(output).to.be.ok();
        expect(output).to.contain(
          'user message'
        );
      });
    });

  });

});
