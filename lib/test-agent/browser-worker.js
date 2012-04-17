(function(window){

  if(typeof(window.TestAgent) === 'undefined'){
    window.TestAgent = {};
  }

  TestAgent.BrowserWorker = function(options){

    if(typeof(options) === 'undefined'){
      options = {};
    }

    this.deps.Server.call(
      this,
      options.server || this.defaults.server
    );

    this.sandbox = new this.deps.Sandbox(
      options.sandbox || this.defaults.sandbox
    );

    this.loader = new this.deps.Loader(
      options.loader || this.defaults.loader
    );


    this.testRunner = options.testRunner;
  };

  //inheritance
  TestAgent.BrowserWorker.prototype = Object.create(
    TestAgent.WebsocketClient.prototype
  );

  var proto = TestAgent.BrowserWorker.prototype;

  proto.deps = {
    Server: TestAgent.WebsocketClient,
    Sandbox: TestAgent.Sandbox,
    Loader: TestAgent.Loader,
    ConfigLoader: TestAgent.Config
  };

  proto.defaults = {
    server: {
      retry: true,
      url: 'ws://' + document.location.host.split(':')[0] + ':8789'
    }
  };

  /**
   * Create a new sandbox instance and set
   * loader to use it as its target.
   *
   * @param {Function} callback
   */
  proto.createSandbox = function(callback){
    var self = this;
    this.sandbox.run(function(){
      self.loader.targetWindow = this;
      if(callback){
        if(!('require' in this)){
          this.require = self.loader.require.bind(self.loader);
        }
        callback.call(this, self.loader);
        self.emit('sandbox', this, self.loader);
      }
    }); 
  };

  /**
   * Builds sandbox executes the .testRunner function.
   *
   * @param {Array} tests
   */
  proto.runTests = function(tests){
    var self = this;

    if(!this.testRunner){
      throw new Error("Worker must be provided a .testRunner method");
    }

    this.createSandbox(function(){
      self.testRunner(self, tests);
    });
  };

  /**
   * Enhances worker with functionality from class.
   *
   *    Enhancement = function(options){}
   *    Enhancement.prototype.enhance = function(server){
   *      //do stuff
   *    }
   *
   *    //second argument passed to constructor
   *    worker.enhance(Enhancement, {isBlue: true});
   *
   *
   * @param {Object} enhancement
   * @param {Object} options
   * @chainable
   */
  proto.use = function(enhancement, options){
    new enhancement(options).enhance(this);

    return this;
  };

}(this));
