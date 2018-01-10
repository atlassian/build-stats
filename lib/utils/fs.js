'use strict';
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const mkdir = promisify(fs.mkdir);
const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

async function ensureDir(dirName) {
  try {
    await mkdir(dirName);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
}

module.exports = {
  mkdir,
  readDir,
  readFile,
  ensureDir,
};
