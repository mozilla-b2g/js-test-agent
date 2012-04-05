var path = require('path');

module.exports = exports = Suite;


Suite.defaults = {
  testDir: 'test/',
  libDir: 'lib/',
  testSuffix: '-test.js',
  libSuffix: '.js'
};

Suite._pathJoins = [
  'path',
  'libDir',
  'testDir'
];

Suite._joinPath = function(key){
  this[key] = path.join(this[key], '/');
};

function Suite(options){
  var option;

  for(option in options){
    if(options.hasOwnProperty(option)){
      this[option] = options[option];
    }
  }

  for(option in Suite.defaults){
    if(Suite.defaults.hasOwnProperty(option)){
      if(typeof(this[option]) === 'undefined'){
        this[option] = Suite.defaults[option];
      }
    }
  }

  Suite._pathJoins.forEach(
    Suite._joinPath, this
  );

  this._definePatterns();

}

Suite.prototype = {

  _definePatterns: function(){
    var ptns = this.patterns = {};

    ptns.testSuffix = new RegExp(
      this.testSuffix + '$'
    );

    ptns.libSuffix = new RegExp(
      this.libSuffix + '$'
    );

    ptns.testDir = new RegExp(
      '^' + this.testDir
    );

    ptns.libDir = new RegExp(
      '^' + this.libDir
    );
  },

  relativePath: function(path){
    return path.replace(this.path, '');
  },

  swapPaths: function(path, type){
    var other = (type == 'lib')? 'test' : 'lib';

    if(this.patterns[type + 'Dir'].test(path)){
      return path;
    }

    return path.
           replace(this.patterns[other + 'Dir'], this[type + 'Dir']).
           replace(this.patterns[other + 'Suffix'], this[type + 'Suffix']);
  },

  /**
   * Checks to see if relative path matches
   * the given type.
   *
   * @param {String} type lib or test
   * @param {String} path the relative path of the file
   */
  matchesType: function(type, path){
    var pathRegex = this.patterns[type + 'Dir'],
        fileRegex = this.patterns[type + 'Suffix'];

    if(!pathRegex || !fileRegex){
      throw Error("Invalid type '" + type + "'");
    }

    return pathRegex.test(path) && fileRegex.test(path);
  },

  testFromPath: function(path){
    var results = {};
    path = this.relativePath(path);

    results.isTest = this.matchesType('test', path);
    results.isLib = this.matchesType('lib', path);

    results.testPath = this.swapPaths(path, 'test');
    results.libPath = this.swapPaths(path, 'lib');

    return results;
  }

};


