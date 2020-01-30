import * as fs from "./fs";
import path from "path";
import * as times from "./times";

const defaultBuildDir = path.join(__dirname, "../..");

export async function getBuildDir(cwd = defaultBuildDir, host, user, repo) {
  const buildsDir = path.join(cwd, ".data", host, user, repo, "builds");
  await fs.mkdirp(buildsDir);
  return buildsDir;
}

export async function getHistory(cwd, host, user, repo, filters) {
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
    if (filters.branch !== "*") {
      if (build.refType !== "branch" && build.refType !== "push") return false;
      if (filters.branch.split(",").indexOf(build.refName) < 0) return false;
    }
    if (filters.result !== "*") {
      if (build.refType !== "branch" && build.refType !== "push") return false;
      if (filters.result.split(",").indexOf(build.result) < 0) return false;
    }
    return true;
  });

  return filtered;
}

export function findLongest(group) {
  return group.reduce((longest, build) => {
    if (longest === null) return build;
    if (longest.duration < build.duration) return build;
    return longest;
  }, null);
}

export function toTimeRanges(builds, { period, last }) {
  let queue = builds.slice();
  let ranges = [];

  while (queue.length) {
    let range = [];
    let first = queue.shift();

    if (!times.withinLastDays(first.createdOn, last * period)) {
      break;
    }

    range.push(first);

    while (
      queue[0] &&
      times.withinDays(first.createdOn, queue[0].createdOn, period)
    ) {
      range.push(queue.shift());
    }

    ranges.push(range);
  }

  return ranges;
}

export async function getLastDownloadedBuildNumber(buildsDir) {
  const currentlyDownloadedBuilds = await fs.readDir(buildsDir);
  const lastDownloadedBuildNumber = currentlyDownloadedBuilds
    .filter(file => file.match(/^.+?\.json$/))
    .map(file => file.replace(".json", ""))
    .map(numStr => parseInt(numStr, 10))
    .sort((a, b) => a - b)
    .pop();

  return lastDownloadedBuildNumber || 0;
}

module.exports = {
  getBuildDir,
  getHistory,
  getLastDownloadedBuildNumber,
  findLongest,
  toTimeRanges
};

