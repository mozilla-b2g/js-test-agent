(function(window){

  function testRunner(worker, tests){
    var sandbox = worker.sandbox.getWindow(),
        loader = worker.loader;

    sandbox.require = loader.require.bind(loader);

    loader.done(function(){
      sandbox.mocha.run(function(){
      });
    });

    loader.require('/vendor/expect.js');

    sandbox.sendReport = function(line){
      worker.send('test data', line);
    };

    loader.require('/vendor/mocha/mocha.js', function(){
      loader.require('/lib/test-agent/mocha/json-stream-reporter.js', function(){
        sandbox.mocha.setup({ui: 'bdd', reporter: sandbox.TestAgent.Mocha.JsonStreamReporter});
        loader.require('/test/helper.js', function(){
          tests.forEach(function(test){
            loader.require(test);
          });
        });
      });
    });
  }


  var worker = new TestAgent.BrowserWorker({
        sandbox: '/runner/sandbox.html',
        testRunner: testRunner
      });

  worker.use(TestAgent.BrowserWorker.Config, {
    url: '/runner/config.json'
  });

  worker.use(TestAgent.BrowserWorker.TestUi);

  worker.on({

    'open': function(){
      console.log('socket open');
    },

    'close': function(){
      console.log('lost client trying to reconnect');
    },

    'run tests': function(data){
      worker.runTests(data.tests);
    }
  });

  worker.config();
  worker.start();

}(this));
