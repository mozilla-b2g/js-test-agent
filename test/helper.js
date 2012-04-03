afterEach(function(){
  //purge test area after each test
  var elements = document.getElementById('test').getElementsByTagName('*'),
      i, element;

  for(i = 0; i < elements.length; i++){
    element = elements[i];
    element.parentNode.removeChild(element);
  }
});

window.require_lib = function(url){
  if(typeof(require) !== 'undefined'){
    require('/lib/' + url);
  }
};
