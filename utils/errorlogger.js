const fs = require('fs');
const fsExtra = require('fs-extra');
const util = require('util');
const datetime = new Date();

FILE_PATH = __dirname + '/../logs/debug.log';

// ensure file exists, if it doesn't it creates one
fsExtra.ensureFileSync(FILE_PATH);

const logFile = fs.createWriteStream(FILE_PATH, {
  flags: 'a+',
});

module.exports.logError = (error, writeToFile = true) => {
  if (writeToFile) {
    logFile.write(
      'At ' +
        datetime.toTimeString() +
        ' on ' +
        datetime.toDateString() +
        '\n\n' +
        util.format(error) +
        '\n\n====================================================\n\n'
    );
  }

  console.error(error);
};
