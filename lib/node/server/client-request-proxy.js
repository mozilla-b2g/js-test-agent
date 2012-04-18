function ClientRequestProxy(){

}


ClientRequestProxy.prototype = {

  enhance: function(server){
    server.on('use proxy', function(data, socket){
      server.http.useProxy(data, socket);
    });
  }

};

module.exports = exports = ClientRequestProxy;
