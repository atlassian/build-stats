'use strict';
const got = require('got');
const ora = require('ora');
const path = require('path');
const chalk = require('chalk');
const { getBuildDir } = require('../utils/builds');
const fs = require('../utils/fs');

function toStandardBuildConfig(build) {
  return {
    id: build.build_number,
    uuid: build.uuid,
    createdOn: build.created_on,
    duration: build.duration_in_seconds,
    result: build.state.result.name,
    refType: build.target.ref_type,
    refName: build.target.ref_name
  };
}

async function fetchBitbucketPipelines(buildsDir, user, repo, auth, downloadHook) {
  let pagelen = 100;
  let page = 1;
  let totalBuilds = 0;
  let buildsDownloaded = 0;

  const spinner = ora({
    text: `Starting download`
  }).start();

  outer:
  do {
    let res = await got(`https://api.bitbucket.org/2.0/repositories/${user}/${repo}/pipelines/?pagelen=${pagelen}&page=${page}&sort=-created_on`, {
      auth
    });
    let json = JSON.parse(res.body);
    let builds = json.values;
    totalBuilds = json.size;

    for (let build of builds) {
      let date = new Date();
      let filePath = path.join(buildsDir, `${build.build_number}.json`);

      if (await fs.exists(filePath)) {
        break outer;
      }

      if (build.state.name !== 'COMPLETED' || build.trigger.name === 'SCHEDULE') {
        continue;
      }

      build = toStandardBuildConfig(build);

      await fs.writeFile(filePath, JSON.stringify(build));
    }

    buildsDownloaded = Math.min(json.page * pagelen, totalBuilds);
    downloadHook && downloadHook(
      buildsDownloaded,
      totalBuilds);
    page++;

    spinner.text = chalk`Downloaded data for {green ${buildsDownloaded}} builds of {green ${totalBuilds}} builds`;
  } while (buildsDownloaded < totalBuilds);
  spinner.succeed(chalk`Download completed. Total Builds: {green ${totalBuilds}}`);
}

exports.download = fetchBitbucketPipelines;
