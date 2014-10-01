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
    suite = new Suite({paths: [__dirname + '/../fixtures/']});
    subject = new Enhance();
    server = factory.websocketServer();
    server.suite = suite;

    subject.enhance(server);

    server.broadcast = function(json) {
      var data = server.parse(json);
      if (data.event === 'run tests') {
        testsToRun = data.data.tests;
      }
      onBroadcast(data);
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


  describe('run a specified list of tests before worker connected', function() {
    var file;

    beforeEach(function(done) {
      var sendFileName;

      file = allTests[0];
      sendFileName = fsPath.join(suite.paths[0], file);

      onBroadcast = function() {
        done();
      };

      server.emit('queue tests', {files: [sendFileName]});
      setTimeout(function() {
        subject._onWorkerReady(server);
      }, 0);
    });

    it('should send run tests with the speified list', function() {
      expect(testsToRun).to.eql([file]);
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

    describe('when given list of tests to run', function() {
      var file;

      beforeEach(function(done) {
        var sendFileName;

        file = allTests[0];
        sendFileName = fsPath.join(suite.paths[0], file);

        onBroadcast = function() {
          done();
        };

        server.emit('queue tests', {files: [sendFileName]});
      });

      it('should send run tests with the specified list', function() {
        expect(testsToRun).to.eql([file]);
      });

    });

    describe('when given list of chunks to run', function() {
      var files = ['/1', '/2', '/3'];

      it('should handle a single chunk length', function(done) {
        onBroadcast = function(result) {
          expect(result.data.tests).to.eql(files);
          done();
        };

        server.emit(
          'queue tests', { files: files, totalChunks: 1, thisChunk: 1 }
        );
      });

      describe('even number of tests', function() {
        var files = [
          '/1',
          '/2',
          '/3',
          '/4',
          '/5',
          '/6'
        ];
        it('should send chunk 1', function(done) {
          onBroadcast = function(result) {
            expect(result.data.tests).to.eql(files.slice(0, 3));
            done();
          };

          server.emit(
            'queue tests', { files: files, totalChunks: 2, thisChunk: 1 }
          );
        });

        it('should send chunk 2', function(done) {
          onBroadcast = function(result) {
            expect(result.data.tests).to.eql(files.slice(3, 6));
            done();
          };

          server.emit(
            'queue tests', { files: files, totalChunks: 2, thisChunk: 2 }
          );
        });
      });

      describe('odd number of tests', function() {
        var files = [
          '/1',
          '/2',
          '/3',
          '/4',
          '/5',
          '/6',
          '/7'
        ];
        it('should send chunk 1', function(done) {
          onBroadcast = function(result) {
            expect(result.data.tests).to.eql(files.slice(0, 3));
            done();
          };

          server.emit(
            'queue tests', { files: files, totalChunks: 3, thisChunk: 1 }
          );
        });

        it('should send chunk 2', function(done) {
          onBroadcast = function(result) {
            expect(result.data.tests).to.eql(files.slice(3, 6));
            done();
          };

          server.emit(
            'queue tests', { files: files, totalChunks: 3, thisChunk: 2 }
          );
        });

        it('should send chunk 3', function(done) {
          onBroadcast = function(result) {
            expect(result.data.tests).to.eql(files.slice(6, 7));
            done();
          };

          server.emit(
            'queue tests', { files: files, totalChunks: 3, thisChunk: 3 }
          );
        });
      });

    });
  });

});
