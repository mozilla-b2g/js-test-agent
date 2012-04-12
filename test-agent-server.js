var Apps = require(__dirname + '/lib/node/server/index'),
    Suite = require(__dirname + '/lib/node/suite'),
    suite = new Suite({
      path: __dirname,
      testDir: 'test/test-agent',
      libDir: 'lib/test-agent'
    });

server.use(Apps.Suite, suite);
