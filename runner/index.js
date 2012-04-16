(function(window){

  var FORMAT_REGEX = /%([0-9])?s/g;

  function format(){
    var i = 0,
        str,
        args = Array.prototype.slice.call(arguments),
        result;

    str = args.shift();

    result = str.replace(FORMAT_REGEX, function(match, pos){
      var index = parseInt(pos || i++, 10);
      return args[index];
    });

    return result;
  }

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


  var doc = window.document,
      selectors = {
        loading: '#loading',
        tests: '#tests',
        execute: '#execute'
      },
      templates,
      loader,
      testQueue = {},
      worker = new TestAgent.BrowserWorker({
        sandbox: '/runner/sandbox.html',
        testRunner: testRunner
      });


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

  worker.start();

  templates = {
    test: '<li data-url="%s">%s</li>'
  };


  server = new TestAgent.Config({
    url: '/runner/config.json'
  });

  server._loadResource(function(){
    var tests = document.querySelector(selectors.tests),
        execute = document.querySelector(selectors.execute);

    execute.addEventListener('click', function(){
      var tests = [], key;

      for(key in testQueue){
        tests.push(key);
      }
      worker.emit('run tests', {tests: tests});
    });

    server.resources.forEach(function(test){
      var frag = document.createElement('div');
      frag.innerHTML = format(templates.test, test, test);
      tests.appendChild(frag.firstChild);
    });

    tests.addEventListener('click', function(e){
      var target = e.target,
          url = target.getAttribute('data-url');

      if(url){
        if(testQueue[url]){
          delete testQueue[url];
          target.className = target.className.replace(' active', '');
        } else {
          testQueue[url] = true;
          target.className += ' active';
        }
      }
    });
  });

}(this));
