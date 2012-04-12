var Enhance = require_lib('node/app/suite'),
    Suite = require_lib('node/suite');

describe("node/app/suite", function(){
  var suite,
      server,
      factory = require('../factory/websocket-server');

  beforeEach(function(){
    suite = new Suite({path: __dirname});
    server = factory.websocketServer();

    server.use(Enhance, suite);
  });

  it("should add .suite to server instance", function(){
    expect(server.suite).to.be(suite);
  });

});
