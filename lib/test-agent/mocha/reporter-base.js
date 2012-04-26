(function(window) {
  if (typeof(window.TestAgent) === 'undefined') {
    window.TestAgent = {};
  }

  if (typeof(window.TestAgent.Mocha) === 'undefined') {
    window.TestAgent.Mocha = {};
  }

  Base.slow = 75;

  //Credit: mocha - https://github.com/visionmedia/mocha/blob/master/lib/reporters/base.js#L194
  function Base(runner) {
    var self = this
, stats = this.stats = { suites: 0, tests: 0, passes: 0, pending: 0, failures: 0 }
      , failures = this.failures = [];

    if (!runner) return;
    this.runner = runner;

    runner.on('start', function onStart() {
      stats.start = new Date;
    });

    runner.on('suite', function onSuite(suite) {
      stats.suites = stats.suites || 0;
      suite.root || stats.suites++;
    });

    runner.on('test end', function onTestEnd(test) {
      stats.tests = stats.tests || 0;
      stats.tests++;
    });

    runner.on('pass', function onPass(test) {
      stats.passes = stats.passes || 0;

      var medium = Base.slow / 2;
      test.speed = test.duration > Base.slow
        ? 'slow'
        : test.duration > medium
          ? 'medium'
          : 'fast';

      stats.passes++;
    });

    runner.on('fail', function onFail(test, err) {
      stats.failures = stats.failures || 0;
      stats.failures++;
      test.err = err;
      failures.push(test);
    });

    runner.on('end', function onEnd() {
      stats.end = new Date;
      stats.duration = new Date - stats.start;
    });

    runner.on('pending', function onPending() {
      stats.pending++;
    });
  }

  window.TestAgent.Mocha.ReporterBase = Base;

}(this));
