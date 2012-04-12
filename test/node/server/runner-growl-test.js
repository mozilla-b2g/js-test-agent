var Apps = require_lib('node/app'),
    RunnerGrowl = Apps.RunnerGrowl,
    growl = require('growl');

describe("node/app/runner-growl", function(){
  var subject,
      server,
      factory = require('../factory/websocket-server'),
      reporter, elipse;


  beforeEach(function(){
    subject = new RunnerGrowl();
    server = factory.websocketServer();

    server.use(Apps.Responder).
           use(Apps.MochaTestEvents, {
             //base is less nosiy
             defaultMochaReporter: 'Base'
           });

    subject.enhance(server);
  });

  describe("initializer", function(){
    it("should have images", function(){
      expect(subject.images).to.be.a(Object);
    });
  });

  describe(".notify", function(){
    it("should be growl", function(){
      expect(subject.notify).to.be(require('growl'));
    });
  });

  describe("when runner emits .end", function(){
    var reportProxy,
        messages = [],
        startDetails = {total: 10},
        startData = ['start', startDetails];

    beforeEach(function(){
      messages = [];
      subject.notify = function(){
        messages.push(arguments);
      }
    });

    beforeEach(function(){
      server.responder.on('test runner', function(proxy){
        reportProxy = proxy;
      });

      //start proxy
      server.responder.emit('test data', startData);
      expect(reportProxy).to.be.ok();
    });

    describe("and test fails", function(){
      beforeEach(function(){

        reportProxy.reporter.stats = {
          failures: startDetails.total
        };
        reportProxy.runner.emit('end');
      });

      it("should notify a failure", function(){
        var notice = messages[0];
        expect(notice[1].image).to.be(subject.images.fail);
        expect(notice[1].title).to.match(/fail/i);
      });

    });

    describe("and test passes", function(){
      beforeEach(function(){

        reportProxy.reporter.stats = {
          failures: 0,
          passes: 10
        };
        reportProxy.runner.emit('end');
      });

      it("should notify a pass", function(){
        var notice = messages[0];
        expect(notice[1].image).to.be(subject.images.pass);
        expect(notice[1].title).to.match(/pass/i);
      });

    });


  });

});
