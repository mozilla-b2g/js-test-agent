(function() {

  var isNode = typeof(window) === 'undefined';

  if (!isNode) {
    if (typeof(TestAgent.Common) === 'undefined') {
      TestAgent.Common = {};
    }
  }

  function Blanket() {

  }

  Blanket.prototype = {

    enhance: function enhance(server) {
      this.server = server;
      server.on('coverage data', this._onCoverageData.bind(this));

      if (typeof(window) !== 'undefined') {
        window.addEventListener('message', function(event) {
          var data = event.data;
          if (/coverage info/.test(data)) {
            server.send('coverage data', data);
          }
        });
      }
    },

    _onCoverageData: function _onCoverageData(data) {
      var data = JSON.parse(data);
      data.shift();
      this._printCoverageResult(data.shift());
    },

    _printCoverageResult: function _printCoverageResult(coverResults) {
      var key,
          titleColor = '\033[1;36m',
          fileNameColor = '\033[0;37m',
          stmtColor = '\033[0;33m',
          percentageColor = '\033[0;36m',
          originColor = '\033[0m';

      // Print title
      console.info('\n\n    ' + titleColor + '-- Blanket.js Test Coverage Result --' + originColor + '\n');
      console.info('    ' + fileNameColor + 'File Name' + originColor +
        ' - ' + stmtColor + 'Covered/Total Smts' + originColor +
        ' - ' + percentageColor + 'Coverage (\%)\n' + originColor);

      // Print coverage result for each file
      coverResults.forEach(function(dataItem) {
        var filename = dataItem.filename,
            formatPrefix = (filename === "Global Total" ? "\n    " : "      "),
            seperator = ' - ';

        filename = (filename === "Global Total" ? filename : filename.substr(0, filename.indexOf('?')));
        outputFormat = formatPrefix;
        outputFormat += fileNameColor + filename + originColor + seperator;
        outputFormat += stmtColor + dataItem.stmts + originColor  + seperator;
        outputFormat += percentageColor + dataItem.percentage + originColor;

        console.info(outputFormat);
      });
    }
  }

  if (isNode) {
    module.exports = Blanket;
  } else {
    TestAgent.Common.BlanketCoverEvents = Blanket;
  }

}());
