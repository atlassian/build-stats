'use strict';
const chalk = require('chalk');
const pLimit = require('p-limit');
const got = require('got');
const ora = require('ora');
const path = require('path');
const { getBuildDir } = require('../utils/builds');
const fs = require('../utils/fs');

const baseUrl = (user, repo) => `https://api.bitbucket.org/2.0/repositories/${user}/${repo}/pipelines/`;

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

async function getTotalBuilds(user, repo) {
  let res = await got(baseUrl(user, repo));
  let resJson = JSON.parse(res.body);
  return resJson.size;
}

async function fetchBitbucketPipelines(buildsDir, user, repo, auth, downloadHook) {
  let pagelen = 100;

  // First check which files we already have
  let currentlyDownloaded = await fs.readDir(buildsDir);
  let lastDownloaded = currentlyDownloaded.filter(file => file.match(/^.+?\.json$/))
    .map(file => file.replace('.json', ''))
    .map(numStr => parseInt(numStr, 10))   // convert to integers
    .sort((a, b) => a - b)                 // sort ascending (default sort )
    .pop();                                // get the last (largest)
  let startingBuild = lastDownloaded ? lastDownloaded + 1 : 1;
  let totalBuilds = await getTotalBuilds(user, repo);
  let startPage = Math.floor(startingBuild / pagelen) + 1;
  let endPage = Math.floor(totalBuilds / pagelen) + 1;

  let limit = pLimit(10); // limits us to running no more than 10 at a time
  let downloaded = startingBuild - 1;
  let spinner = ora().start('Starting download');

  let requestPromises = [];
  for (let page = startPage; page <= endPage; page++) {
    let url = `${baseUrl(user, repo)}?pagelen=${pagelen}&page=${page}&sort=created_on`;
    requestPromises.push(limit(async () => {
      let res = await got(url, { auth });
      let resJson = JSON.parse(res.body);
      let builds = resJson.values;

      let writeFilePromises = builds.map((build) => {
        let date = new Date();
        let filePath = path.join(buildsDir, `${build.build_number}.json`);

        if (build.state.name !== 'COMPLETED' || build.trigger.name === 'SCHEDULE') {
          return Promise.resolve();
        }
        build = toStandardBuildConfig(build);

        return fs.writeFile(filePath, JSON.stringify(build));
      });

      await Promise.all(writeFilePromises);

      downloaded += builds.length;
      spinner.text = chalk`Downloaded data for {green ${downloaded}} builds of {green ${totalBuilds}} builds`;
      downloadHook && downloadHook(downloaded, totalBuilds);
    }));
  }

  await Promise.all(requestPromises);

  spinner.succeed(chalk`Download completed. Total Builds: {green ${totalBuilds}}`);
}

exports.download = fetchBitbucketPipelines;
