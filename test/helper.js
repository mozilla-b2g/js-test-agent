afterEach(function(){
  if(typeof(window) === 'undefined'){
    return;
  }
  //purge test area after each test
  var elements = document.getElementById('test').getElementsByTagName('*'),
      i, element;

  for(i = 0; i < elements.length; i++){
    element = elements[i];
    element.parentNode.removeChild(element);
  }
});

(function(exports){

  var isNode = (typeof(window) === 'undefined');

  if(isNode){
    exports.expect = require('expect.js');
  }

  exports.require_lib = function(url){
    if(typeof(require) !== 'undefined'){
      if(isNode){
        return require('../lib/' + url);
      } else {
        require('/lib/' + url);
      }
    }
  };

}(
  (typeof(window) === 'undefined')?  global : window
));

