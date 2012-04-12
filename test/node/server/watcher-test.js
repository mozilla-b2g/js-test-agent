var Watcher = require('../../../lib/node/server/watcher'),
    Suite = require('../../../lib/node/suite'),
    Responder = require('../../../lib/test-agent/responder').TestAgent.Responder,
    fs = require('fs'),
    fsPath = require('path');

describe("node/server/watcher", function(){

  var subject, suite, server = {},
      broadcasted;

  server.broadcast = function(message){
    broadcasted.push(message);
  };

  beforeEach(function(){
    suite = new Suite({
      path: __dirname + '/../fixtures/'
    });

    server.responder = new Responder();

    subject = new Watcher();
    broadcasted = [];

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
      }, 150);
    });

    afterEach(function(){
      fs.writeFileSync(files[0], '');
    });

    it("should broadcast file has changed", function(){
      var data = {
        tests: [fsPath.join(subject.basePath, suitePath.testPath)],
      };

      expect(broadcasted[0]).to.eql(
        Responder.stringify(subject.eventName, data)
      );
    });

  });

});
