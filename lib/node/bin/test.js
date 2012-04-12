var Client = require('../../test-agent/websocket-client').TestAgent.WebsocketClient,
    url = 'ws://localhost:8789',
    optimist = require('optimist'),
    argv,
    instance = new Client({
      url: url,
      retry: true
    });

argv = optimist
  .usage('Executes tests in all available clients. Defaults to running all tests.\n\njs-test-agent test [file, ...]')
  .argv;

if(argv.help){
  optimist.showHelp();
  process.exit(0);
}

instance.on('open', function(socket){
  var files = process.argv.slice(3),
      fsPath = require('path');

  files = files.map(function(file){
    file = fsPath.normalize(file);
    if(file[0] !== '/'){
      file = fsPath.join(process.env.PWD, file);
    }
    return file;
  });

  instance.send('start tests', {files: files});
  process.exit(0);
});

instance.start();
