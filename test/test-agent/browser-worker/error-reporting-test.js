requireLib('*test-agent/browser-worker');
requireLib('test-agent/browser-worker/error-reporting.js');


describe('test-agent/browser-worker/config', function() {

  var subject, sent;

  beforeEach(function() {
    sent = null;
    subject = TestAgent.factory.browserWorker();
    subject.use(TestAgent.BrowserWorker.ErrorReporting, {
      url: '/test/test-agent/fixtures/config.json'
    });

    subject.send = function() {
      sent = arguments;
    }
  });

  describe('on enhancement', function() {

    describe('on sandbox error', function() {
      var data = {
        lineno: 20,
        file: 'somefile',
        message: 'foo'
      };

      beforeEach(function() {
        subject.emit('sandbox error', data);
      });

      it('should send event to server', function() {
        expect(sent).to.eql([
          'error',
          data
        ]);
      });

    });

  });

});

