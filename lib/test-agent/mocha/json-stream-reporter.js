(function(window){

  if(typeof(window.TestAgent) === 'undefined'){
    window.TestAgent = {};
  }

  if(typeof(window.TestAgent.Mocha) === 'undefined'){
    window.TestAgent.Mocha = {};
  }

  var Base = window.mocha.reporters.Base,
      exports = window.TestAgent.Mocha;

  MochaReporter.console = window.console;
  MochaReporter.send = function(){};

  //TODO -- Buffer console.log calls

  function MochaReporter(runner) {
    Base.call(this, runner);

    var self = this,
        stats = this.stats,
        total = runner.total,
        indentation = -1,
        suiteTitle,
        currentTest;

    MochaReporter.console.log = function(){
      var stack, messages = Array.prototype.slice.call(arguments).map(function(item){
        if(!item){
          return item;
        }
        return (item.toString)? item.toString() : item;
      });

      try {
        throw new Error();
      } catch (e){
        stack = e.stack;
      }

      //re-orgnaize the stack to exlude the above
      stack = stack.split("\n").map(function(e){
        return e.trim().replace(/^at /, '');
      });

      stack.splice(0, 1);
      stack = stack.join("\n");

      //this is temp
      MochaReporter.send(JSON.stringify(['log', {messages: messages, stack: stack}]));
    };

    runner.on('suite', function(suite){
      indentation++;
      MochaReporter.send(JSON.stringify(['suite', jsonExport(suite, { indentation: indentation }) ]));
    });

    runner.on('suite end', function(suite){
      MochaReporter.send(JSON.stringify(['suite end', jsonExport(suite, { indentation: indentation }) ]));
      indentation--;
    });

    runner.on('test', function(test){
      MochaReporter.send(JSON.stringify(['test', jsonExport(test) ]));
    });

    runner.on('test end', function(test){
      MochaReporter.send(JSON.stringify(['test end', jsonExport(test) ]));
    });

    runner.on('start', function(){
      MochaReporter.send( JSON.stringify(['start', { total: total }]) );
    });

    runner.on('pass', function(test){
      MochaReporter.send(JSON.stringify(['pass', jsonExport(test)]));
    });

    runner.on('fail', function(test, err){
      MochaReporter.send(JSON.stringify(['fail', jsonExport(test, {err: jsonErrorExport(err) })]));
    });

    runner.on('end', function(){
      MochaReporter.send(JSON.stringify(['end', self.stats]));
    });
  }

  var exportKeys = [
    'title',
    'getTitle',
    'fullTitle',
    'root',
    'duration',
    'state'
  ];

  function jsonErrorExport(err){
    var result = {};

    result.stack = err.stack;
    result.message = err.message;
    result.type = err.type;
    result.constructorName = err.constructor.name;
    result.expected = err.expected;
    result.actual = err.actual;

    return result;
  }

  function jsonExport(object, additional) {
    var result = {}, key;

    exportKeys.forEach(function(key){
      var value;
      if(key in object){
        value = object[key];

        if(typeof(value) === 'function'){
          result[key] = object[key]();
        } else {
          result[key] = value;
        }
      }
    });

    if(typeof(additional) !== 'undefined'){
      for(key in additional){
        if(additional.hasOwnProperty(key)){
          result[key] = additional[key];
        }
      }
    }
    return result;
  }

  //export
  exports.JsonStreamReporter = MochaReporter;

}(this));

