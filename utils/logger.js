const fs = require('fs');
const fsExtra = require('fs-extra');
const util = require('util');
const datetime = new Date();

ERROR_FILE_PATH = __dirname + '/../logs/debug.log';
INFO_FILE_PATH = __dirname + '/../logs/info.log';

// ensure file exists, if it doesn't it creates one
fsExtra.ensureFileSync(ERROR_FILE_PATH);
fsExtra.ensureFileSync(INFO_FILE_PATH);

const infoFile = fs.createWriteStream(INFO_FILE_PATH, {
  flags: 'a+',
});

const errorFile = fs.createWriteStream(ERROR_FILE_PATH, {
  flags: 'a+',
});

module.exports.logError = (error, writeToFile = true) => {
  if (writeToFile) {
    errorFile.write(
      'At ' +
        datetime.toTimeString() +
        ' on ' +
        datetime.toDateString() +
        '\n\n' +
        util.format(error) +
        '\n\n====================================================\n\n'
    );
  }

  console.log('ERROR:');
  console.error(error);
};

module.exports.logInfo = (info, writeToFile = true) => {
  if (writeToFile) {
    infoFile.write(
      'At ' +
        datetime.toTimeString() +
        ' on ' +
        datetime.toDateString() +
        '\n\n' +
        util.format(info) +
        '\n\n====================================================\n\n'
    );
  }

  console.log('INFO:');
  console.error(info);
};
