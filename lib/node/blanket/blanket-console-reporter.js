var path = require('path'),
    fs = require('fs');

function BlanketConsoleReporter(options) {
  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      this[key] = options[key];
    }
  }

  this.setupThresholds();
  this.totalPasses = 0;
  this.totalFailures = 0;
}

BlanketConsoleReporter.prototype = {

  enhance: function enhance(server) {
    server.on('coverage report', this._onCoverageData.bind(this));
    server.on('test runner end', this._printCoverageSummary.bind(this));
  },

  _onCoverageData: function _onCoverageData(data) {
    data = this._parseCoverageData(data);
    this._printConsoleFormat(data);
  },

  _parseCoverageData: function _parseCoverageData(data) {
    var coverResults = [],
        files = data.files,
        fileInfo,
        covered,
        total,
        coveredSum = 0,
        totalSum = 0;

    var percentage = function(covered, total) {
      return Math.round(((covered / total) * 100) * 100) / 100;
    };

    var stmts = function(covered, total) {
      return covered + '/' + total;
    };

    for (var filename in files) {
      fileInfo = files[filename];
      covered = 0;
      total = 0;

      for (var key in fileInfo) {
        if (typeof(fileInfo[key]) === 'number') {
          total++;
          if (fileInfo[key] > 0) {
            covered++;
          }
        }
      }

      coveredSum += covered;
      totalSum += total;

      coverResults.push({
        filename: filename,
        stmts: stmts(covered, total),
        percentage: percentage(covered, total)
      });
    }

    coverResults.push({
      filename: 'Global Total',
      stmts: stmts(coveredSum, totalSum),
      percentage: percentage(coveredSum, totalSum)
    });

    return coverResults;
  },

  _printConsoleFormat: function _printConsoleFormat(coverResults) {
    var appName = coverResults[0].filename.match(this.pattern)[1],
        titleColor = '\u001b[1;36m',
        fileNameColor = '\u001b[0;37m',
        stmtColor = '\u001b[0;33m',
        passColor = '\u001b[0;32m',
        failColor = '\u001b[0;31m',
        thresholdColor = '\u001B[1;33m',
        originColor = '\u001b[0m',
        outputFormat,
        fails = 0,
        totals = coverResults.length - 1;

    // Print title
    console.log('\n%s-- Test Coverage for %s%s%s --\n', titleColor, stmtColor,
      (appName[0].toUpperCase() + appName.slice(1)), titleColor);
    console.log('%sFile Name%s - %sCovered/Total Smts%s - %sCoverage (%)\n',
      fileNameColor, originColor, stmtColor, originColor, passColor);

    // Print coverage result for each file
    coverResults.forEach(function(dataItem) {
      var filename = dataItem.filename,
          formatPrefix = (filename === 'Global Total' ? '\n' : '  '),
          seperator = ' - ',
          isPassThreshold = this.validateThreshold(appName, dataItem),
          arrow = isPassThreshold ? ' > ' : ' < ',
          covColor = isPassThreshold ? passColor : failColor;

      if (filename !== 'Global Total') {
        if (!isPassThreshold) {
          fails++;
          this.totalFailures++;
        } else {
          this.totalPasses++;
        }
      }

      filename = (filename === 'Global Total' ? filename :
        (filename.substr(0, filename.indexOf('?')) || filename));
      outputFormat = formatPrefix;
      outputFormat += fileNameColor + filename + originColor + seperator;
      outputFormat += stmtColor + dataItem.stmts + originColor  + seperator;
      outputFormat += covColor + dataItem.percentage + ' %' + originColor;

      console.log(outputFormat);
    }, this);

    outputFormat = thresholdColor + '\nThreshold = ' +
      this.getAppThreshold(appName) + '%, ';

    if (fails === 0) {
      outputFormat += passColor + 'COVERAGE PASS';
    } else {
      outputFormat += failColor + 'COVERAGE FAIL: ' + fails + '/' +
        totals + ' files failed coverage';
    }

    console.log(outputFormat);
  },

  _printCoverageSummary: function _printCoverageSummary() {
    var passColor = '\u001b[0;32m',
        failColor = '\u001b[0;31m',
        originColor = '\u001b[0m',
        passes = this.totalPasses,
        fails = this.totalFailures,
        totals = passes + fails,
        output;

    if (this.totalFailures === 0) {
      output = passColor + 'SUMMARY COVERAGE PASS: ' + passes + '/' + totals;
      output += ' files passed coverage';
    } else {
      output = failColor + 'SUMMARY COVERAGE FAILS: ' + fails + '/' + totals;
      output += ' files failed coverage';
    }

    console.log(output + originColor);
  },

  setupThresholds: function setupThresholds() {
    var file =  fs.readFileSync(path.join(process.cwd(), this.path));
    this.thresholds = JSON.parse(file);
  },

  getAppThreshold: function getAppThreshold(appName) {
    return this.thresholds[appName] || 0;
  },

  validateThreshold: function validateThreshold(appName, dataItem) {
    return (dataItem.percentage >= this.getAppThreshold(appName));
  }

};

module.exports = BlanketConsoleReporter;
