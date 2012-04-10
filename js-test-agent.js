var Apps = require(__dirname + '/lib/node/app/index'),
    Suite = require(__dirname + '/lib/node/suite');

server.use(Apps.Responder).
       use(Apps.Broadcast).
       use(Apps.MochaTestEvents).
       use(Apps.RunnerGrowl).
       use(Apps.Watcher, new Suite({
          path: __dirname
       }));

