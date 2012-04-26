describe('node/watchr', function() {
  var Watchr = require('../../lib/node/watchr'),
      files = [],
      fs = require('fs'),
      subject,
      MatchFiles = require('match-files'),
      fixtures = __dirname + '/fixtures/',
      callback;


  before(function(done) {
    MatchFiles.find(fixtures, {}, function(err, found) {
      files = found;
      done();
    });
  });

  beforeEach(function() {
    subject = new Watchr(files);
  });

  afterEach(function() {
    //clear watchr callbacks
    subject.stop();
  });

  describe('initialization', function() {

    it('should store a list files', function() {
      expect(subject.files).to.eql(files);
    });

    it('should create an object for .watchers', function() {
      expect(subject.watchers).to.eql({});
    });

  });


  describe('.stop', function() {

    var mockWatcher;

    describe('when there are no watchers', function() {
      it('should not throw', function() {
        expect(subject.stop());
      });
    });

    describe('when are watchers', function() {

      beforeEach(function() {
        mockWatcher = {
          stop: function() {
            mockWatcher.isStopped = true;
          }
        };

        subject.watchers.fakeFile = mockWatcher;
        subject.stop();
      });

      it('should have called stop on the watchers', function() {
        expect(mockWatcher.isStopped).to.be(true);
      });

      it('should have no more watchers', function() {
        expect(subject.watchers).to.eql({});
      });
    });

  });

  //NOTE! When mocha is running in --watch it breaks this test!
  describe('.watch', function() {

    describe('when changing a file', function() {
      var file;

      beforeEach(function() {
        file = files[0];
      });

      afterEach(function() {
        //clear out file
        fs.writeFileSync(file, '');
      });

      it('should notify callback when a file has changed', function(done) {
        var exec = require('child_process').exec;

        subject.start(function(fileName) {
          expect(fileName).to.be(file);
          done();
        });

        expect(subject.watchers[file]).to.be.ok();
        fs.writeFileSync(file, 'fooobarz');
      });

    });

  });

});
