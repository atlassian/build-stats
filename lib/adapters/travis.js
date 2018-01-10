"use strict";
const fs = require("fs");
const got = require("got");
const path = require("path");
const { promisify } = require("util");
const { getBuildDir } = require("../utils/builds");
const writeFile = promisify(fs.writeFile);
const stat = promisify(fs.stat);

const RESULT_TO_STATUS = {
  '0': 'SUCCESSFUL',
  '1': 'FAILED'
}

function toStandardBuildConfig(build) {
  return {
    id: build.number,
    uuid: build.id,
    createdOn: build.started_at,
    duration: build.duration,
    result: RESULT_TO_STATUS[build.result] || 'STOPPED',
    refType: build.event_type,
    refName: build.branch
  };
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }
  }
  return false;
}

async function fetchPipelines(buildsDir, user, repo) {
  let next = 0;
  let totalBuilds = 0;
  let tillBuild = 0;

  outer: do {
    let res = await got(
      `https://api.travis-ci.org/repos/${user}/${repo}/builds?after_number${
      next !== 0 ? "=" + next : ""
      }`
    );

    let builds = JSON.parse(res.body);

    if (!builds.length) break outer;

    let fetchedTillBuild = parseInt(builds[0].number);

    if (fetchedTillBuild > totalBuilds) {
      totalBuilds = fetchedTillBuild;
    }

    for (let build of builds) {
      let filePath = path.join(buildsDir, `${build.number}.json`);

      if (await exists(filePath)) {
        break outer;
      }

      if (build.state !== "finished") {
        continue;
      }

      build = toStandardBuildConfig(build);

      await writeFile(filePath, JSON.stringify(build));
    }

    if (fetchedTillBuild - 25 < 1) {
      next = 0;
    } else {
      next = fetchedTillBuild - 25;
    }

    console.log(`downloaded ${totalBuilds - next} of ${totalBuilds}`);
  } while (next > 1);
}

exports.download = fetchPipelines;
