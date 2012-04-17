(function(window){

  function testRunner(worker, tests){
    var sandbox = worker.sandbox.getWindow(),
        loader = worker.loader;

    function multiReporter(){
      var reporters = Array.prototype.slice.call(arguments);

      return function(runner){
        reporters.forEach(function(Reporter){
          new Reporter(runner);
        });
      };
    }

    sandbox.require = loader.require.bind(loader);

    loader.done(function(){
      sandbox.mocha.run(function(){
      });
    });

    loader.require('/vendor/mocha/mocha.js', function(){
      loader.require('/lib/test-agent/mocha/json-stream-reporter.js', function(){
        var jsonReporter = sandbox.TestAgent.Mocha.JsonStreamReporter;

        jsonReporter.console = sandbox.console;

        jsonReporter.send = function(line){
          worker.send('test data', line);
        };

        sandbox.mocha.setup({ui: 'bdd', reporter: multiReporter(jsonReporter, sandbox.mocha.reporters.HTML)});

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

    'sandbox': function() {
      worker.loader.require('/vendor/expect.js');
    },

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
