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

  function fragment(){
    var string = format.apply(this, arguments),
        element = document.createElement('div');

    element.innerHTML = string;
    return element.firstChild;
  }

  var TestUi = window.TestAgent.BrowserWorker.TestUi = function(options){
    var selector;

    if(typeof(options) === 'undefined'){
      options = {};
    }

    selector = options.selector || '#test-agent-ui';
    this.element = options.element || document.querySelector(selector);
    this.queue = {};
  };


  TestUi.prototype = {
    templates: {
      testList: '<ul class="test-agent"></ul>',
      testItem: '<li data-url="%s">%s</li>',
      testRun: '<button class="run-tests">Execute</button>'
    },

    enhance: function(worker){
      this.worker = worker;
      this.worker.on('config', this.onConfig.bind(this));
    },

    onConfig: function(data){
      //purge elements
      var elements = this.element.getElementsByTagName('*'),
          element,
          templates = this.templates,
          i = 0,
          parent;

      for(; i < elements.length; i++){
        element = elements[i];
        element.parentNode.removeChild(element);
      }

      parent = fragment(templates.testList);

      data.tests.forEach(function(test){
        parent.appendChild(fragment(
          templates.testItem,
          test,
          test
        ));
      });

      this.element.appendChild(
        parent
      );

      this.element.appendChild(fragment(templates.testRun));

      this.initDomEvents();
    },

    initDomEvents: function(){
      var ul = this.element.querySelector('ul'),
          button = this.element.querySelector('button'),
          self = this,
          activeClass = ' active';

      ul.addEventListener('click', function(e){
        var target = e.target,
            url = target.getAttribute('data-url');

        if(url){
          if(self.queue[url]){
            target.className = target.className.replace(activeClass, '');
            delete self.queue[url];
          } else {
            target.className += activeClass;
            self.queue[url] = true;
          }
        }
      });

      button.addEventListener('click', function(){
        var tests = [], key;

        for(key in self.queue){
          if(self.queue.hasOwnProperty(key)){
            tests.push(key);
          }
        }
        self.worker.emit('run tests', {tests: tests});
      });
    }

  };

}(this));
