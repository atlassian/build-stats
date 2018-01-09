'use strict';
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);

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

module.exports = {
  daysToMs,
  getBuildDir,
  withInDays,
  withinLast
}