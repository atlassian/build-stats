"use strict";
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const { getBuildDir } = require("./util");
const bitbucketCalculate = require("../ci/bitbucket/bitbucketCalculate");
const travisCalculate = require("../ci/travis/travisCalculate");

async function calculate({
  cwd,
  host,
  user,
  repo,
  branch = "*",
  period = 1,
  last = 30
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

  switch (host) {
    case "travis":
      travisCalculate(builds, period, last);
      break;
    case "bitbucket":
      bitbucketCalculate(builds, period, last);
      break;
  }
}

module.exports = calculate;
