(function(window){

  if(typeof(window.TestAgent) === 'undefined'){
    window.TestAgent = {};
  }

  var factory = window.TestAgent.factory = window.TestAgent.factory || {};


  factory.browserWorker = testSupport.factory({
    sandbox: '/test/fixtures/iframe.html',

    testRunner: function(){
      return function(){};
    }

  }, TestAgent.BrowserWorker);

}(this));
