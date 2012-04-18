var Client = require('../../test-agent/websocket-client').TestAgent.WebsocketClient,
    optimist = require('optimist'),
    argv,
    mime = require('node-static/lib/node-static/mime'),
    fs = require('fs'),
    fsPath = require('path');

argv = optimist
  .usage('Servers current directory on the server')
  .option('server', {
    desc: "WebSocket server location",
    default: 'ws://localhost:8789'
  })
  .option('prefix', {
    default: '/client-1/',
    desc: 'prefix on server to use'
  })
  .argv;

if(argv.help){
  optimist.showHelp();
  process.exit(0);
}

instance = new Client({
  url: argv.server,
  retry: true
});

instance.on('open', function(socket){
  instance.send('use proxy', { prefix: argv.prefix });
  console.log('Sending use proxy: %s to server: %s', argv.prefix, argv.server);
});


//this should really be a stream but what the hell
instance.on('proxy request', function(file){
  var path = fsPath.join(process.env.PWD, file.replace('..', '')),
      allowed = ['css', 'json', 'js', 'html'],
      suffix;


  if(path.lastIndexOf('/') === path.length-1){
    path += 'index.html';
  }

  suffix = fsPath.extname(path).slice(1);

  if(allowed.indexOf(suffix) < 0){
    instance.send('proxy ' + file, {
      error: 'not allowed',
      file: file
    });
    return;
  }

  fs.readFile(path, 'utf8', function(err, contents){
    instance.send('proxy ' + file, {
      file: file,
      content: contents,
      mime: mime.contentTypes[suffix] || 'plain/text'
    });
  });
});

instance.start();

