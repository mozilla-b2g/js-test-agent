(function(window){


  var Worker = window.TestAgent.BrowserWorker;


  Worker.Config = function(options){
    if(typeof(options) === 'undefined'){
      options = {};
    }

    this.config = new TestAgent.Config(options);
  };

  Worker.Config.prototype = {
    enhance: function(worker){
      worker.config = this._config.bind(this, worker, this.config);
    },

    _config: function(worker, config, callback){
      config.load(function(data){
        worker.emit('config', data);
        if(callback){
          callback(data);
        }
      });
    }

  };

}(this));
