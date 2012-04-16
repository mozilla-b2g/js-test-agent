var Enhance = require_lib('node/server/queue-tests'),
    Suite = require_lib('node/suite'),
    fsPath = require('path');

describe("node/server/queue-tests", function(){

  var server,
      subject,
      suite,
      testsToRun = [],
      factory = require('../factory/websocket-server'),
      onBroadcast;

  beforeEach(function(){
    suite = new Suite({path: __dirname + '/../fixtures/'});
    subject = new Enhance();
    server = factory.websocketServer();
    server.suite = suite;

    subject.enhance(server);

    server.broadcast = function(json){
      var data = server.parse(json);
      if(data.event === 'run tests'){
        testsToRun = data.data.tests;
      }
      onBroadcast();
    };
  });


  describe("event: start tests", function(){
    var allTests = null;

    beforeEach(function(done){
      if(!allTests){
        suite.findTestFiles(function(err, files){
          allTests = files.map(function(file){
            return suite.testFromPath(file).testUrl;
          });
          done();
        });
      } else {
        done();
      }
    });

    it("should have fixture files to test against", function(){
      expect(allTests.length > 0).to.be.ok();
    });

    describe("when not given list of tests to run", function(){
      beforeEach(function(done){
        onBroadcast = function(){
          done();
        };

        server.emit('queue tests');
      });

      it("should send run tests with all available tests", function(){
        expect(testsToRun.sort()).to.eql(allTests.sort());
      });

    });

    describe("when given list of tests to run", function(){
      var file;

      beforeEach(function(done){
        var sendFileName;

        file = allTests[0];
        sendFileName = fsPath.join(suite.path, file);

        onBroadcast = function(){
          done();
        };

        server.emit('queue tests', {files: [ sendFileName ]});
      });

      it("should send run tests with the ", function(){
        expect(testsToRun).to.eql([file]);
      });

    });

  });

});
