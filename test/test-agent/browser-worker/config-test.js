requireLib('*test-agent/browser-worker');
requireLib('test-agent/config.js');
requireLib('test-agent/browser-worker/config.js');


describe("test-agent/browser-worker/config", function(){
  
  var subject;

  beforeEach(function(){
    subject = TestAgent.factory.browserWorker();
    subject.use(TestAgent.BrowserWorker.Config, {
      url: '/test/test-agent/fixtures/config.json'
    });
  });

  describe("on enhancement", function(){

    it("should expose a config method", function(){
      expect(subject.config).to.be.a(Function);
    });

    describe(".config", function(){
      var configEvent = [];

      beforeEach(function(done){
        subject.on('config', function(){
          configEvent.push(arguments);
        });

        subject.config(function(){
          done();
        });
      });

      it("should emit config data", function(){
        expect(configEvent[0][0]).to.eql({tests: ['one']});
      });

    });
    
  });

});
