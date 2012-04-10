function Growl(){}

Growl.prototype = {

  notify: require('growl'),

  images: {
    fail: __dirname + '/../../../images/error.png',
    pass: __dirname + '/../../../images/ok.png'
  },

  enhance: function(server){
    server.responder.on('test runner', this.growl.bind(this, server));
  },

  growl: function(server, proxy) {
    var notify = this.notify,
        images = this.images,
        runner = proxy.runner,
        reporter = proxy.reporter;

    runner.on('end', function(){
      var stats = reporter.stats;
      if (stats.failures) {
        var msg = stats.failures + ' of ' + runner.total + ' tests failed';
        notify(msg, { title: 'Failed', image: images.fail });
      } else {
        notify(stats.passes + ' tests passed in ' + stats.duration + 'ms', {
            title: 'Passed',
            image: images.pass
        });
      }
    });
  }


};


module.exports = exports = Growl;
