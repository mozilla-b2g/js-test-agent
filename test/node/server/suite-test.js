var Enhance = require_lib('node/server/suite'),
    Suite = require_lib('node/suite'),
    fsPath = require('path');

describe('node/server/suite', function() {
  var suite,
      server,
      factory = require('../factory/websocket-server');

  beforeEach(function() {
    suite = new Suite({
      path: __dirname,
      configJSONPath: fsPath.resolve(__dirname + '/../../../test-agent-config.json')
    });
    server = factory.websocketServer();

    server.use(Enhance, suite);
  });

  it('should add .suite to server instance', function() {
    expect(server.suite).to.be(suite);
  });

});
