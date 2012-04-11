var server = new (require('../websocket-server')),
    fsPath = require('path'),
    optimist = require('optimist'),
    configFile,
    argv;

var chain = optimist.
  usage("js-test-agent server --port [num] --configFile [./js-test-agent]").
  option('server', {
    desc: "Starts websocket server when given"
  }).
  option('configFile', {
    alias: 'c',
    default: './.js-test-agent.js'
  }).
  option('port', {
    alias: 'p',
    default: 8789
  });

argv = chain.argv;

configFile = fsPath.normalize(argv.configFile);

if(configFile[0] !== '/'){
  configFile = fsPath.join(process.env['PWD'], configFile);
}

if(!fsPath.existsSync(configFile)){
  console.error("%s cannot be loaded - it does not exist", configFile);
  process.exit(1);
}

server.listen(argv.port);
server.optimist = chain;

console.log("Listening on port: %s", argv.port);
console.log("Loading config file '%s'", configFile);

server.expose(configFile, function(){
  //so enhancements can add options
  if(argv.help){
    optimist.showHelp();
    process.exit(0);
  }
});
