require_lib('test-agent/config.js');

describe("TestAgent.Config", function(){

  var subject,
      url = '/test/fixtures/tests.json',
      files = [
        '/test/fixtures/tests/one-test.js',
        '/test/fixtures/tests/two-test.js'
      ];

  beforeEach(function(){
    subject = new TestAgent.Config({
      url: url
    });
  });

  describe("initializer", function(){
    it("should set options given in first argument", function(){
      expect(subject.url).to.be(url);
    });
  });

  describe("._parseResponse", function(){
    var fixture, json, result;

    beforeEach(function(){
      var fakeXHR = {};

      fixture = {
        tests: ['wow/one.js']
      };

      json = JSON.stringify(fixture);

      fakeXHR = {
        responseText: json
      };

      result = subject._parseResponse(fakeXHR);
    });

    it("should return list of files", function(){
      expect(result).to.eql(fixture);
    });

  });

  describe(".load", function(){

    var arg;

    describe("when successful", function(){
      beforeEach(function(done){
        subject.load(function(files){
          arg = files;
          done();
        });
      });

      it("should be ready", function(){
        expect(subject.ready).to.be(true);
      });

      it("should return the config file as first argument in callback", function(){
        expect(arg.tests).to.eql(files);
      });

      it("should have loaded resources", function(){
        expect(subject.resources).to.eql(files);
      });
    });
  });

});
