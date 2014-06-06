var Watcher = require('../../../lib/node/server/watcher'),
    Suite = require('../../../lib/node/suite'),
    Responder = require('../../../lib/test-agent/responder'),
    fs = require('fs'),
    fsPath = require('path'),
    sinon = require('sinon');

describe('node/server/watcher', function() {

  var subject,
      suite,
      server,
      queueTests;


  beforeEach(function() {
    suite = new Suite({
      paths: [__dirname + '/../fixtures/']
    });

    server = new Responder();

    subject = new Watcher();
    queueTests = [];

    server.on(subject.eventName, function(message) {
      queueTests.push(message);
    });

    //needs a suite to work
    server.suite = suite;
    subject.enhance(server);
  });

  describe('when a file has changed', function() {
    var files = [],
        calledWith,
        clock;

    beforeEach(function(done) {
      files = suite.findFiles(function(err, found) {
        files = found;
        done();
      });
    });

    beforeEach(function(done) {
      var oldTimeout = setTimeout;
      clock = sinon.useFakeTimers('setTimeout');
      fs.writeFileSync(files[0], 'foo!');
      fs.writeFileSync(files[1], 'foo!');

      // just wait for the notification using a real setTimeout
      clock._setTimeout(function() {
        done();
      }, 500);
    });

    afterEach(function() {
      fs.writeFileSync(files[0], '');
      fs.writeFileSync(files[1], '');
      clock.restore();
    });

    it('should emit event on server after a timeout', function() {
      var data = {
        files: [files[0], files[1]].sort()
      };

      expect(queueTests).empty();

      clock.tick(1000);

      queueTests[0].files = queueTests[0].files.sort();
      expect(queueTests[0]).to.eql(
        data
      );
    });

  });

});
