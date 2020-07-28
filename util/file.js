const fs = require('fs');
const path = require('path');

const deleteFile = (filepath) => {
  // eslint-disable-next-line no-param-reassign
  filepath = path.join(__dirname, '..', filepath);
  fs.unlink(filepath, (err) => {
    if (err) {
      throw err;
    }
  });
};

exports.deleteFile = deleteFile;
