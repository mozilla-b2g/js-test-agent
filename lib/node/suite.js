var fsPath = require('path'),
    MatchFiles = require('match-files');

module.exports = exports = Suite;

Suite.defaults = {
  testDir: 'test/',
  libDir: 'lib/',
  includeDirs: [],
  blacklist: [],
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

Suite._joinPath = function _joinPath(key) {
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

  _definePatterns: function _definePatterns() {
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
      prefix + this.testDir.replace(/\\/g, '\\\\')
    );

    ptns.libDir = new RegExp(
      prefix + this.libDir.replace(/\\/g, '\\\\')
    );
  },

  relativePath: function relativePath(file) {
    var match;

    if (file.indexOf(this.path) !== -1) {
      match = this.path;
    }

    file = file.replace(match, '');

    this.includeDirs.forEach(function(dir) {
      file = file.replace(new RegExp('^' + dir), '');
    });

    return file;
  },

  swapPaths: function swapPaths(path, type) {
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

  _joinResults: function _joinResults(pending, callback) {
    var files = [];

    return function(err, found) {
      if (err) {
        callback(err);
      } else {
        files = files.concat(found);
      }

      pending--;

      if (pending === 0) {
        callback(null, files);
      }
    };
  },

  /**
   * Finds all files for the suite.
   *
   * @param {Function} callback first argument is the list of files found.
   */
  findFiles: function findFiles(callback) {
    // We will invoke joinResults twice so always set 2
    var pending = 2,
        joinResults = this._joinResults(pending, callback);

    this.findTestFiles(joinResults);
    this.findLibFiles(joinResults);
  },

  _filterFile: function _filterFile(type, path) {
    return this.matchesType(type, path) && !this.matchesSkip(path) && this.matchesDir(path);
  },

  /**
   * Finds all files in the testDir
   *
   * @param {Function} callback
   */
  findTestFiles: function findTestFiles(callback, options) {
    var pending = 1,
        joinResults = this._joinResults(pending, callback),
        opts = options || {},
        filterFile = this._filterFile.bind(this, 'test');

    if (opts.fileFilters && Array.isArray(opts.fileFilters)) {
      opts.fileFilters.unshift(filterFile);
    } else {
      opts.fileFilters = [filterFile];
    }

    MatchFiles.find(this.path, opts, joinResults);
  },

  /**
   * Finds all files in the libDir
   *
   * @param {Function} callback
   */
  findLibFiles: function findLibFiles(callback, options) {
    var pending = 1,
        joinResults = this._joinResults(pending, callback),
        opts = options || {},
        filterFile = this._filterFile.bind(this, 'lib');

    if (opts.fileFilters && Array.isArray(opts.fileFilters)) {
      opts.fileFilters.push(filterFile);
    } else {
      opts.fileFilters = [filterFile];
    }

    MatchFiles.find(this.path, opts, joinResults);
  },

  /**
   * Checks to see if relative path matches
   * the given type.
   *
   * @param {String} type lib or test.
   * @param {String} path the relative path of the file.
   */
  matchesType: function matchesType(type, path) {
    var pathRegex = this.patterns[type + 'Dir'],
        fileRegex = this.patterns[type + 'Suffix'];

    if (!pathRegex || !fileRegex) {
      throw Error("Invalid type '" + type + "'");
    }

    return pathRegex.test(path) && fileRegex.test(path);
  },

  /**
   * Checks to see if relative path matches
   * the given dir path.
   *
   * @param {String} path the relative path of the file.
   */
  matchesDir: function matchesDir(path) {
    var includeDirs = this.includeDirs,
        result = true;

    if (includeDirs.length > 0) {
      result = this.includeDirs.some(function(dir) {
        var reg = new RegExp('^' + dir);
        return reg.test(path);
      });
    }

    return result;
  },

  /**
   * Checks to see if relative path matches
   * the given skip path.
   *
   * @param {String} path the relative path of the file.
   */
  matchesSkip: function matchesSkip(path) {
    var blacklist = this.blacklist,
        result = false;

    if (blacklist.length > 0) {
      result = blacklist.some(function(skip){
        return (skip === path);
      });
    }

    return result;
  },

  testFromPath: function testFromPath(path) {
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
