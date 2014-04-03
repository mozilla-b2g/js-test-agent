describe('node/suite', function() {

  var Suite = require('../../lib/node/suite'),
      MatchFiles = require('match-files'),
      fsPath = require('path'),
      subject,
      root = __dirname + '/././fixtures',
      normalizedRoot = fsPath.normalize(root),
      libPath = 'lib/foo.js',
      testPath = 'test/foo-test.js';

  beforeEach(function() {
    subject = new Suite({
      path: root,
    });
  });

  describe('initialize', function() {

    describe('defaults', function() {

      beforeEach(function() {
        subject = new Suite({
          path: root,
        });
      });

      it('should normalize .paths', function() {
        expect(subject.path).to.equal(fsPath.normalize(root) + '/');
      });

      it('should have set path and appended a slash', function() {
        expect(subject.path).to.equal(normalizedRoot + '/');
      });

      it('should have set testDir', function() {
        expect(subject.testDir).to.equal('test/');
      });

      it('should have set libDir', function() {
        expect(subject.libDir).to.equal('lib/');
      });

      it('should have set testSuffix', function() {
        expect(subject.testSuffix).to.equal('-test.js');
      });

      it('should have set libSuffix', function() {
        expect(subject.libSuffix).to.equal('.js');
      });

      it('should have baseUrl', function() {
        expect(subject.baseUrl).to.be('/');
      });

    });

    describe('overriding', function() {

      var val = 'foo', overrides = {
        testDir: val,
        libDir: val,
        testSuffix: val,
        libSuffix: val,
        path: normalizedRoot + '/',
      }, key;

      beforeEach(function() {
        subject = new Suite(overrides);
      });

      for (key in overrides) {
        if (overrides.hasOwnProperty(key)) {
          (function() {
            it('should allow overriding ' + key, function() {
              expect(subject[key]).to.eql(overrides[key]);
            });
          }(key));
        }
      }
    });

  });

  describe('._definePatterns', function() {

    var r = function(str) {
      return new RegExp(str);
    };

    var expected = {
      testSuffix: r('-test.js$'),
      libSuffix: r('.js$'),
      testDir: r('^test/'),
      libDir: r('^lib/')
    }, ptn;

    it('should have created .patterns object', function() {
      expect(subject.patterns).to.be.an('object');
    });

    for (ptn in expected) {
      if (expected.hasOwnProperty(ptn)) {
        (function(ptn) {
          it('should have created a pattern ' + ptn + ' ' + expected[ptn].toString(), function() {
            expect(subject.patterns[ptn]).to.be.a(RegExp);
            expect(subject.patterns[ptn].toString()).to.be(expected[ptn].toString());
          });
        }(ptn));
      }
    }

  });

  describe('.relativePath', function() {

    it('should return a path relative to the root without a starting slash', function() {
      var expected = 'myFoo/path.js';
      expect(subject.relativePath(normalizedRoot + '/myFoo/path.js')).to.eql(expected);
    });

  });

  describe('.swapPaths', function() {

    it('should return lib path when converting from lib -> lib', function() {
      expect(subject.swapPaths(libPath, 'lib')).to.eql(libPath);
    });

    it('should return lib path when converting from test -> test', function() {
      expect(subject.swapPaths(testPath, 'test')).to.eql(testPath);
    });

    it('should return test path when converting lib -> test', function() {
      expect(subject.swapPaths(libPath, 'test')).to.eql(
        testPath
      );
    });

    it('should return lib path when converting test -> lib', function() {
      expect(subject.swapPaths(testPath, 'lib')).to.eql(
        libPath
      );
    });

  });

  describe('.matchesType', function() {

    var matches = {
      lib: {
        'lib/foo.js': true,
        'lib/MyOtherFoo.js': true,
        //Because suffix is .js
        'lib/MyFooTest.js': true
      },

      test: {
        'test/foo.js': false,
        'test/test-test.js': true,
        'test/Other-test.js': true,
        'test/MyOtherFootest.js': false
      }
    }, type, path, expected;

    //Ok, this is bad.
    //When let is introduced we can use that
    for (type in matches) {

      (function(type) {

        describe('when matching for ' + type, function() {
          for (path in matches[type]) {
            (function(path, expected) {
              it('should return ' + expected + ' when given ' + path, function() {
                expect(subject.matchesType(type, path)).to.be(expected);
              });
            }(path, matches[type][path]));
          }
        });

      }(type));
    }

    it('should throw an error when given an invalid type', function() {
      expect(function() {
        subject.matchesType('fake', 'foo');
      }).to.throwException();
    });

  });

  describe('.matchesDir', function() {

    var matches = {
      'myApp/lib/foo.js': true,
      'myApp/lib/MyOtherFoo.js': true,
      'otherApp/lib/MyFooTest.js': false,
      'otherApp/test/foo-test.js': false,
      'myApp/test/test-test.js': true,
      'myApp/test/Other-test.js': true,
      'myApp2/test/MyOtherFootest.js': false
    }, path;

    beforeEach(function() {
      subject.includeDirs = ['myApp/'];
    });

    afterEach(function() {
      subject.includeDirs = null;
    });

    it('should match for directory', function() {
      for (path in matches) {
        expect(subject.matchesDir(path)).to.be(matches[path]);
      }
    });

  });

  describe('.matchesSkip', function() {

    var blacklist = {
      'myApp/lib/foo.js': true,
      'myApp/lib/MyOtherFoo.js': true,
      'otherApp/lib/MyFooTest.js': true,
      'otherApp/test/foo-test.js': false,
      'myApp/test/test-test.js': false,
      'myApp/test/Other-test.js': false,
      'myApp2/test/MyOtherFootest.js': true
    }, path;

    beforeEach(function() {
      subject.blacklist = [
        'myApp/lib/foo.js',
        'myApp/lib/MyOtherFoo.js',
        'otherApp/lib/MyFooTest.js',
        'myApp2/test/MyOtherFootest.js'
      ];
    });

    it('should skip for specified blacklist', function() {
      for (path in blacklist) {
        expect(subject.matchesSkip(path)).to.be(blacklist[path]);
      }
    });

  });

  describe('file operations', function() {
    var testFiles, libFiles;

    before(function(done) {
      MatchFiles.find(normalizedRoot + '/lib', {}, function(err, found) {
        libFiles = found;
        done();
      });
    });

    before(function(done) {
      MatchFiles.find(normalizedRoot + '/test/', {}, function(err, found) {
        //remove file which is not a test
        var idx = found.indexOf(normalizedRoot + '/test/helper.js');
        found.splice(idx, 1);
        testFiles = found;
        done();
      });
    });

    describe('.findFiles', function() {
      it('should return all lib and test files', function(done) {
        subject.findFiles(function(err, found) {
          expect((testFiles.concat(libFiles)).sort()).to.eql(found.sort());
          done();
        });
      });
    });

    describe('.findTestFiles', function() {
      it('should return all test files', function(done) {
        subject.findTestFiles(function(err, found) {
          expect(testFiles.sort()).to.eql(found.sort());
          done();
        });
      });
    });

    describe('.findLibFiles', function() {
      it('should return all lib files', function(done) {
        subject.findLibFiles(function(err, found) {
          expect(libFiles.sort()).to.eql(found.sort());
          done();
        });
      });
    });

  });

  describe('.testFromPath', function() {

    var results;

    shouldReturnPathDetails = function(path, isTest) {

      beforeEach(function() {
        results = subject.testFromPath(normalizedRoot + '/' + path);
      });

      it('should have .isTest === ' + isTest, function() {
        expect(results.isTest).to.be(isTest);
      });

      it('should have .isLib === ' + !isTest, function() {
        expect(results.isLib).to.be(!isTest);
      });

      it('should have .libPath', function() {
        expect(results.libPath).to.eql(libPath);
      });

      it('should return .testPath', function() {
        expect(results.testPath).to.eql(testPath);
      });

      it('should return .testUrl', function() {
        expect(results.testUrl).to.eql(fsPath.join(subject.baseUrl, testPath));
      });
    };

    describe('in strict mode fase', function() {

      var subject,
          result,
          paths = {
            'lib': fsPath.join(root, 'app', 'appName', 'lib', 'file.js'),
            'test': fsPath.join(root, 'app', 'appName', 'test', 'file-test.js')
          };

      beforeEach(function() {
        subject = new Suite({
          path: root,
          strictMode: false
        });

      });

      it('should convert lib to test', function() {
        var result = subject.testFromPath(paths.lib);
        expect(result.isLib).to.be(true);
        expect(result.testPath).to.be('app/appName/test/file-test.js');
        expect(result.testUrl).to.be('/app/appName/test/file-test.js');
      });

      it('should convert test to lib', function() {
        var result = subject.testFromPath(paths.test);
        expect(result.isTest).to.be(true);
        expect(result.libPath).to.be('app/appName/lib/file.js');
      });

    });

    describe('when given a path that matches dir but not suffix', function() {

      beforeEach(function() {
        results = subject.testFromPath(normalizedRoot + '/' + 'test/foo.js');
      });

      it('should set isTest & isLib to false', function() {
        expect(results.isLib).to.be(false);
        expect(results.isTest).to.be(false);
      });

    });

    describe('results after given a test path', function() {
      shouldReturnPathDetails(testPath, true);
    });

    describe('results after given a lib path', function() {
      shouldReturnPathDetails(libPath, false);
    });

  });

});
