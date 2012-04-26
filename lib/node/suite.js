var fsPath = require('path'),
    MatchFiles = require('match-files');

module.exports = exports = Suite;


Suite.defaults = {
  testDir: 'test/',
  libDir: 'lib/',
  testSuffix: '-test.js',
  libSuffix: '.js',
  baseUrl: '/',
  strictMode: true
};

Suite._pathJoins = [
  'path',
  'libDir',
  'testDir'
];

Suite._joinPath = function(key) {
  this[key] = fsPath.join(fsPath.normalize(this[key]), '/');
};

function Suite(options) {
  var option;

  for (option in options) {
    if (options.hasOwnProperty(option)) {
      this[option] = options[option];
    }
  }

  for (option in Suite.defaults) {
    if (Suite.defaults.hasOwnProperty(option)) {
      if (typeof(this[option]) === 'undefined') {
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

  _definePatterns: function() {
    var ptns = this.patterns = {},
        prefix;


    prefix = (this.strictMode) ? '^' : '';

    ptns.testSuffix = new RegExp(
      this.testSuffix + '$'
    );

    ptns.libSuffix = new RegExp(
      this.libSuffix + '$'
    );

    ptns.testDir = new RegExp(
      prefix + this.testDir
    );

    ptns.libDir = new RegExp(
      prefix + this.libDir
    );
  },

  relativePath: function(path) {
    return path.replace(this.path, '');
  },

  swapPaths: function(path, type) {
    var other = (type == 'lib') ? 'test' : 'lib',
        result;

    if (this.patterns[type + 'Dir'].test(path)) {
      return path;
    }


    result = path.
           replace(this.patterns[other + 'Dir'], this[type + 'Dir']).
           replace(this.patterns[other + 'Suffix'], this[type + 'Suffix']);


    return result;
  },

  /**
   * Finds all files for the suite.
   *
   * @param {Function} callback first argument is the list of files found.
   */
  findFiles: function(callback) {
    //always 2
    var pending = 2,
        files = [];

    function joinResults(err, found) {
      if (err) {
        callback(err);
      } else {
        files = files.concat(found);
      }

      pending--;

      if (pending === 0) {
        callback(null, files);
      }
    }

    this.findTestFiles(joinResults);
    this.findLibFiles(joinResults);
  },

  _filterFile: function(type, path) {
    return this.matchesType(type, path);
  },

  /**
   * Finds all files in the testDir
   *
   * @param {Function} callback
   */
  findTestFiles: function(callback) {
    MatchFiles.find(this.path, {
      fileFilters: [this._filterFile.bind(this, 'test')]
    }, callback);
  },

  /**
   * Finds all files in the testDir
   *
   * @param {Function} callback
   */
  findLibFiles: function(callback) {
    MatchFiles.find(this.path, {
      fileFilters: [this._filterFile.bind(this, 'lib')]
    }, callback);
  },

  /**
   * Checks to see if relative path matches
   * the given type.
   *
   * @param {String} type lib or test.
   * @param {String} path the relative path of the file.
   */
  matchesType: function(type, path) {
    var pathRegex = this.patterns[type + 'Dir'],
        fileRegex = this.patterns[type + 'Suffix'];

    if (!pathRegex || !fileRegex) {
      throw Error("Invalid type '" + type + "'");
    }

    return pathRegex.test(path) && fileRegex.test(path);
  },

  testFromPath: function(path) {
    var results = {};
    path = this.relativePath(path);

    results.isTest = this.matchesType('test', path);
    results.isLib = this.matchesType('lib', path);

    results.testPath = this.swapPaths(path, 'test');
    results.libPath = this.swapPaths(path, 'lib');
    results.testUrl = fsPath.join(this.baseUrl, results.testPath);

    return results;
  }

};


