'use strict';
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const leftPad = require('left-pad');
const chalk = require('chalk');

const mkdir = promisify(fs.mkdir);
const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

const GRAPH_MAX_LENGTH = 15;
const TWENTY_MINS_IN_SECS = 60 * 20;

function daysToMs(days) {
  return 1000 * 60 * 60 * 24 * days;
}

function withInDays(a, b, days) {
  let aTime = +new Date(a.createdOn);
  let bTime = +new Date(b.createdOn);

  return aTime - bTime < daysToMs(days);
}

function withinLast(days, period, build) {
  const now = Date.now();
  let buildDateTime = +new Date(build.createdOn);
  let daysInMs = daysToMs(days * period);

  return buildDateTime > now - daysInMs;
}

async function ensureDir(dirName) {
  try {
    await mkdir(dirName);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
}

async function getBuildDir(cwd, host, user, repo) {
  let dataDir = path.join(cwd, '.data');
  await ensureDir(dataDir);
  let hostDir = path.join(dataDir, host);
  await ensureDir(hostDir);
  let userDir = path.join(hostDir, user);
  await ensureDir(userDir);
  let repoDir = path.join(userDir, repo);
  await ensureDir(repoDir);
  let buildsDir = path.join(repoDir, 'builds');
  await ensureDir(buildsDir);
  return buildsDir;
}

async function getHistory(cwd, host, user, repo, filters) {
  let buildsDir = await getBuildDir(cwd, host, user, repo);
  let files = await readDir(buildsDir);
  let builds = [];

  for (let fileName of files) {
    let filePath = path.join(buildsDir, fileName);
    let fileContents = await readFile(filePath);
    let build = JSON.parse(fileContents);
    builds.push(build);
  }

  let sorted = builds.sort((a, b) => {
    return +new Date(b.createdOn) - +new Date(a.createdOn);
  });

  let filtered = builds.filter(build => {
    if (filters.branch !== '*') {
      if (build.refType !== 'branch') return false;
      if (filters.branch.split(',').indexOf(build.refName) < 0) return false;
    }
    if (filters.result !== '*') {
      if (build.refType !== 'branch') return false;
      if (filters.result.split(',').indexOf(build.result) < 0) return false;
    }
    return true;
  });

  return filtered;
}

function formatDuration(duration) {
  return `${leftPad((duration / 60).toFixed(2), 8, '')} min`;
}

function formatPipe(value, min, max) {
  let distance = max - min;
  let unit = GRAPH_MAX_LENGTH / distance;
  let length = Math.ceil((value - min) * unit);
  let bar = '█' + new Array(length).join('█') + new Array(15).join(' ');

  if (length > GRAPH_MAX_LENGTH / 2) {
    return chalk.red(bar);
  } else {
    return chalk.green(bar);
  }
}

module.exports = {
  GRAPH_MAX_LENGTH,
  TWENTY_MINS_IN_SECS,
  daysToMs,
  getBuildDir,
  withInDays,
  withinLast,
  getHistory,
  formatDuration,
  formatPipe
}
