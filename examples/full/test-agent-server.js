//all require paths must be absolute -- use __dirname
var Agent = require('test-agent'),
    Apps = Agent.server,
    Suite = Agent.Suite,
    suite = new Suite({
      paths: [__dirname],
      testDir: 'test/',
      libDir: 'lib/'
    });

server.use(Apps.Suite, suite);

