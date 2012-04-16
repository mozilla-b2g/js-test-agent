var Watcher = require('../../../lib/node/server/watcher'),
    Suite = require('../../../lib/node/suite'),
    Responder = require('../../../lib/test-agent/responder').TestAgent.Responder,
    fs = require('fs'),
    fsPath = require('path');

describe("node/server/watcher", function(){

  var subject, 
      suite,
      server,
      queueTests;


  beforeEach(function(){
    suite = new Suite({
      path: __dirname + '/../fixtures/'
    });

    server = new Responder();

    server.on('queue tests', function(message){
      queueTests.push(message);
    });

    subject = new Watcher();
    queueTests = [];

    //needs a suite to work
    server.suite = suite;
    subject.enhance(server);
  });

  describe("when a file has changed", function(){
    var files = [],
        suitePath,
        calledWith;

    beforeEach(function(done){
      files = suite.findFiles(function(err, found){
        files = found;
        done();
      });
    });

    beforeEach(function(done){
      fs.writeFileSync(files[0], 'foo!');
      suitePath = suite.testFromPath(files[0]);
      //just wait
      setTimeout(function(){
      fs.writeFileSync(files[0], 'foo!');
        done();
      }, 200);
    });

    afterEach(function(){
      fs.writeFileSync(files[0], '');
    });

    it("should emit queue-tests event on server", function(){
      var data = {
        files: [files[0]]
      };

      expect(queueTests[0]).to.eql(
        data
      );
    });

  });

});
