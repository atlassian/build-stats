'use strict';
const fs = require('./fs');
const path = require('path');
const times = require('./times');

async function getBuildDir(cwd, host, user, repo) {
  let dataDir = path.join(cwd, '.data');
  await fs.ensureDir(dataDir);
  let hostDir = path.join(dataDir, host);
  await fs.ensureDir(hostDir);
  let userDir = path.join(hostDir, user);
  await fs.ensureDir(userDir);
  let repoDir = path.join(userDir, repo);
  await fs.ensureDir(repoDir);
  let buildsDir = path.join(repoDir, 'builds');
  await fs.ensureDir(buildsDir);
  return buildsDir;
};

async function getHistory(cwd, host, user, repo, filters) {
  let buildsDir = await getBuildDir(cwd, host, user, repo);
  let files = await fs.readDir(buildsDir);
  let builds = [];

  for (let fileName of files) {
    let filePath = path.join(buildsDir, fileName);
    let fileContents = await fs.readFile(filePath);
    let build = JSON.parse(fileContents);
    builds.push(build);
  }

  let sorted = builds.sort((a, b) => {
    return +new Date(b.createdOn) - +new Date(a.createdOn);
  });

  let filtered = builds.filter(build => {
    if (filters.branch !== '*') {
      if (build.refType !== 'branch' && build.refType !== 'push') return false;
      if (filters.branch.split(',').indexOf(build.refName) < 0) return false;
    }
    if (filters.result !== '*') {
      if (build.refType !== 'branch' && build.refType !== 'push') return false;
      if (filters.result.split(',').indexOf(build.result) < 0) return false;
    }
    return true;
  });

  return filtered;
}

function findLongest(group) {
  return group.reduce((longest, build) => {
    if (longest === null) return build;
    if (longest.duration < build.duration) return build;
    return longest;
  }, null);
}

function toTimeRanges(builds, { period, last }) {
  let queue = builds.slice();
  let ranges = [];

  while (queue.length) {
    let range = [];
    let first = queue.shift();

    if (!times.withinLastDays(first.createdOn, last * period)) {
      break;
    }

    range.push(first);

    while (queue[0] && times.withinDays(first.createdOn, queue[0].createdOn, period)) {
      range.push(queue.shift());
    }

    ranges.push(range);
  }

  return ranges;
}

module.exports = {
  getBuildDir,
  getHistory,
  findLongest,
  toTimeRanges,
};
