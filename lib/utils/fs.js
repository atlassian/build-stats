"use strict";
const fs = require("fs");
const mkdirpFn = require("mkdirp");
const path = require("path");
const { promisify } = require("util");

const mkdir = promisify(fs.mkdir);
const mkdirp = promisify(mkdirpFn);
const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

module.exports = {
  mkdir,
  readDir,
  readFile,
  writeFile,
  mkdirp
};
