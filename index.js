'use strict';
const fs = require('fs');
const got = require('got');
const path = require('path');
const pLimit = require('p-limit');
const { promisify } = require('util');
const groupBy = require('lodash.groupby');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const stat = promisify(fs.stat);
const readDir = promisify(fs.readdir);

async function ensureDir(dirName) {
  try {
    await mkdir(dirName);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
}

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

async function fetchAllPipelines(buildsDir, user, repo) {
  let page = 1;
  let total = 0;

  outer:
  do {
    let res = await got(`https://api.bitbucket.org/2.0/repositories/${user}/${repo}/pipelines/?pagelen=100&page=${page}&sort=-created_on`);
    let json = JSON.parse(res.body);
    let builds = json.values;

    for (let build of builds) {
      let date = new Date();
      let filePath = path.join(buildsDir, `${build.build_number}.json`);

      if (await exists(filePath)) {
        break outer;
      }

      if (build.state.name !== 'COMPLETED') {
        continue;
      }

      await writeFile(filePath, JSON.stringify(build));
    }

    total = json.size;
    console.log(`Page: ${json.page}, Total: ${json.size}`);
    page++;
  } while (page * 100 < total);
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

async function download({
  cwd,
  host,
  user,
  repo
}) {
  let buildsDir = await getBuildDir(cwd, host, user, repo);
  await fetchAllPipelines(buildsDir, user, repo);
}

const DAY_IN_MS = 1000 * 60 * 60 * 24;

function withinADay(a, b) {
  let aTime = +new Date(a.createdOn);
  let bTime = +new Date(b.createdOn);

  return aTime - bTime  < DAY_IN_MS;
}

async function calculate({
  cwd,
  host,
  user,
  repo,
  branch = '*',
  period = 30,
  last = 12,
}) {
  let buildsDir = await getBuildDir(cwd, host, user, repo);
  let files = await readDir(buildsDir);
  let builds = [];

  for (let fileName of files) {
    let filePath = path.join(buildsDir, fileName);
    let fileContents = await readFile(filePath);
    let build = JSON.parse(fileContents);
    builds.push(build);
  }

  // console.log(JSON.stringify(builds.map(build => build.trigger), null, 2));

  builds = builds.filter(build => {
    return build.trigger.name !== 'SCHEDULE';
  }).map(build => {
    return {
      id: build.build_number,
      uuid: build.uuid,
      createdOn: build.created_on,
      duration: build.duration_in_seconds,
      result: build.state.result.name,
      refType: build.target.ref_type,
      refName: build.target.ref_name,
    };
  });

  let sorted = builds.sort((a, b) => {
    return +new Date(b.createdOn) - +new Date(a.createdOn);
  });

  let queue = sorted.slice();

  // let json = {};

  let ranges = [];

  while (queue.length) {
    let range = [];
    let first = queue.shift();

    range.push(first);

    while (queue[0] && withinADay(first, queue[0])) {
      range.push(queue.shift());
    }

    ranges.push(range);
  }

  let data = { ranges: [] };

  for (let range of ranges) {
    let rangeData = {};

    rangeData.ALL = calculateGroup(range);

    let groups = groupBy(range, build => build.result);

    for (let groupName of Object.keys(groups)) {
      rangeData[groupName] = calculateGroup(groups[groupName]);
    }

    data.ranges.push(rangeData);
  }

  // console.log(JSON.stringify(data, null, 2));

  // console.log(ranges[0].filter(build => build.result === 'SUCCESSFUL').map(build => ({ id: build.id, duration: build.duration / 60 })));
  // console.log(data.ranges[0]);
  // console.log(data.ranges.slice(0, 2));
  console.log(data.ranges.map(range => range.SUCCESSFUL && range.SUCCESSFUL.buildDurationMean / 60));

  // console.log(host, user, repo, branch, period, last);
}


function calculateGroup(builds) {
  let totalBuilds = builds.length;
  let totalDuration = 0;

  for (let build of builds) {
    totalDuration += build.duration;
  }

  let buildDurationMean = totalDuration / totalBuilds;

  return {
    totalBuilds,
    buildDurationMean,
  };
}

module.exports = {
  download,
  calculate,
};
