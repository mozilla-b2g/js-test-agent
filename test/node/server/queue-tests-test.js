var Enhance = require_lib('node/server/queue-tests'),
    Suite = require_lib('node/suite'),
    fsPath = require('path');

describe('node/server/queue-tests', function() {

  var server,
      subject,
      suite,
      allTests,
      testsToRun = [],
      factory = require('../factory/websocket-server'),
      onBroadcast;

  beforeEach(function(done) {
    suite = new Suite({
      path: fsPath.resolve(__dirname + '/../../'),
      includeDirs: ['node/'],
      configJSONPath: fsPath.resolve(__dirname + '/../../../test-agent-config.json'),
      strictMode: false
    });
    subject = new Enhance();
    server = factory.websocketServer();
    server.suite = suite;

    subject.enhance(server);

    server.broadcast = function(json) {
      var data = server.parse(json);
      if (data.event === 'run tests') {
        testsToRun = data.data.tests;
      }
      onBroadcast();
    };

    if (!allTests) {
      suite.findTestFiles(function(err, files) {
        allTests = files.map(function(file) {
          return suite.testFromPath(file).testUrl;
        });
        done();
      });
    } else {
      done();
    }
  });

  it('should have fixture files to test against', function() {
    expect(allTests.length > 0).to.be.ok();
  });

  describe('run all tests before worker has connected', function() {

    beforeEach(function(done) {
      onBroadcast = function() {
        done();
      };

      server.emit('queue tests');

      setTimeout(function() {
        subject._onWorkerReady(server);
      }, 0);
    });

    it('should send run tests with all available tests', function() {
      expect(testsToRun.sort()).to.eql(allTests.sort());
    });

  });

  describe('run a specified app before worker connected', function() {

    beforeEach(function(done) {
      var appName = 'fixtures';

      onBroadcast = function() {
        done();
      };

      server.emit('queue tests', {app: appName});
      setTimeout(function() {
        subject._onWorkerReady(server);
      }, 0);
    });

    it('should send run tests with the speified list', function() {
      expect(testsToRun.sort()).to.eql(allTests.sort());
    });

  });

  describe('event: start tests after worker connected', function() {

    beforeEach(function() {
      subject._onWorkerReady(server);
    });

    describe('when not given list of tests to run', function() {
      beforeEach(function(done) {
        onBroadcast = function() {
          done();
        };

        server.emit('queue tests');
      });

      it('should send run tests with all available tests', function() {
        expect(testsToRun.sort()).to.eql(allTests.sort());
      });

    });

    describe('when given list of tests for specified app to run', function() {

      beforeEach(function(done) {
        var appName = 'fixtures';

        onBroadcast = function() {
          done();
        };

        server.emit('queue tests', {app: appName});
      });

      it('should send run tests with the specified app', function() {
        expect(testsToRun.sort()).to.eql(allTests.sort());
      });

    });

  });

});
