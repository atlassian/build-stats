const fs = require("fs");
const mkdirpFn = require("mkdirp");
const { promisify } = require("util");

export const mkdir = promisify(fs.mkdir);
export const mkdirp = promisify(mkdirpFn);
export const readDir = promisify(fs.readdir);
export const readFile = promisify(fs.readFile);
export const writeFile = promisify(fs.writeFile);
