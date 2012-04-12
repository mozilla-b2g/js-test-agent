var Apps = require(__dirname + '/lib/node/server/index'),
    Suite = require(__dirname + '/lib/node/suite'),
    suite = new Suite({
      path: __dirname,
      testDir: 'test/test-agent',
      libDir: 'lib/test-agent'
    });

server.use(Apps.Responder).
       use(Apps.Suite, suite).
       use(Apps.Broadcast).
       use(Apps.MochaTestEvents).
       use(Apps.RunnerGrowl).
       use(Apps.StartTests).
       use(Apps.Watcher);

