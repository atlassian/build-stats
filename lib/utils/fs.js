'use strict';
const fs = require('fs');
const mkdirpFn = require('mkdirp');
const path = require('path');
const { promisify } = require('util');

const mkdir = promisify(fs.mkdir);
const mkdirp = promisify(mkdirpFn);
const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);


async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
  return false;
}

module.exports = {
  mkdir,
  readDir,
  readFile,
  writeFile,
  stat,
  mkdirp,
  exists,
};
