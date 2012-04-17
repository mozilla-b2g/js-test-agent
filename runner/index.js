(function(window){

  var worker = new TestAgent.BrowserWorker({
        sandbox: '/runner/sandbox.html',
      });

  worker.use(TestAgent.BrowserWorker.Config, {
    url: '/runner/config.json'
  });

  worker.use(TestAgent.BrowserWorker.MochaDriver, {
    mochaUrl: '/vendor/mocha/mocha.js',
    testHelperUrl: '/test/helper.js'
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

  });

  worker.config();
  worker.start();

}(this));
