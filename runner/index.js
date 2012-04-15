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


  var doc = window.document,
      selectors = {
        loading: '#loading',
        tests: '#tests',
        execute: '#execute'
      },
      templates,
      server,
      currentSandbox,
      loader,
      testQueue = {},
      client,
      url = ('ws://' + document.location.host.split(':')[0] + ':8789');

  client = new TestAgent.WebsocketClient({
    retry: true,
    url: url
  });

  client.on({

    'open': function(){
      console.log('socket open');
    },

    'close': function(){
      console.log('lost client trying to reconnect');
    },

    'run tests': function(data){
      runSandbox.apply(null, data.tests);
    }
  });

  window.sendReport = function(line){
    client.send('test data', line);
  };

  client.start();

  templates = {
    test: '<li data-url="%s">%s</li>'
  };


  server = new TestAgent.Config({
    url: '/runner/config.json'
  });

  loader = new TestAgent.Loader();

  function createSandbox(callback){
    if(currentSandbox){
      currentSandbox.destroy();
    }

    currentSandbox = new TestAgent.Sandbox('/runner/sandbox.html?time=' + String(Date.now()));
    currentSandbox.run(function(){
      loader.targetWindow = currentSandbox.getWindow();
      var require = this.require = loader.require.bind(loader);
      callback.call(this);
    });
  }

  function runSandbox(){
    var url, tests = [];

    if(arguments.length > 0){
      tests = Array.prototype.slice.call(arguments);
    } else {
      for(url in testQueue){
        if(testQueue.hasOwnProperty(url)){
          tests.push(url);
        }
      }
    }

    createSandbox(function(){
      var self = this;
      loader.done(function(){
        self.mocha.run(function(){
        });
      });

      this.require('/vendor/expect.js');
      this.require('/vendor/mocha/mocha.js', function(){
        self.require('/lib/test-agent/mocha/json-stream-reporter.js', function(){
          self.mocha.setup({ui: 'bdd', reporter: self.TestAgent.Mocha.JsonStreamReporter});
          self.require('/test/helper.js', function(){
            tests.forEach(function(test){
              self.require(test);
            });
          });
        });
      });
    });

  }

  server._loadResource(function(){
    var tests = document.querySelector(selectors.tests),
        execute = document.querySelector(selectors.execute);

    execute.addEventListener('click', function(){
      runSandbox();
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
