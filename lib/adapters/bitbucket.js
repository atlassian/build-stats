'use strict';
const chalk = require('chalk');
const pLimit = require('p-limit');
const got = require('got');
const ora = require('ora');
const path = require('path');
const {
  getBuildDir,
  getLastDownloadedBuildNumber
} = require('../utils/builds');
const fs = require('../utils/fs');

const baseUrl = (user, repo) =>
  `https://api.bitbucket.org/2.0/repositories/${user}/${repo}/pipelines/`;

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

async function getTotalBuilds(user, repo, { auth }) {
  let res = await got(baseUrl(user, repo), { auth });
  let resJson = JSON.parse(res.body);
  return resJson.size;
}

async function fetchBitbucketPipelines(
  buildsDir,
  { auth, concurrency, downloadHook, since }
) {
  let spinner = ora().start('Initializing download');
  const [repo, user] = buildsDir.match(/(.*)\/(.*)\/(.*)\//).reverse();
  const pagelen = 100;
  const limit = pLimit(concurrency); // limits the number of concurrent requests
  let lastDownloaded = since;

  if (lastDownloaded == undefined) {
    lastDownloaded = await getLastDownloadedBuildNumber(buildsDir);
  }
  let startingBuild = lastDownloaded ? lastDownloaded + 1 : 1;
  let totalBuilds = await getTotalBuilds(user, repo, { auth });
  let startPage = Math.floor(startingBuild / pagelen) + 1;
  let endPage = Math.floor(totalBuilds / pagelen) + 1;
  let downloaded = startingBuild - 1;
  spinner.text = 'Starting download';

  let requestPromises = [];
  for (let page = startPage; page <= endPage; page++) {
    let url = `${baseUrl(
      user,
      repo
    )}?pagelen=${pagelen}&page=${page}&sort=created_on`;
    requestPromises.push(
      limit(async () => {
        let res = await got(url, { auth });
        let resJson = JSON.parse(res.body);
        let builds = resJson.values;

        let writeFilePromises = builds.map(build => {
          let date = new Date();
          let filePath = path.join(buildsDir, `${build.build_number}.json`);

          if (
            build.state.name !== 'COMPLETED' ||
            build.trigger.name === 'SCHEDULE'
          ) {
            return Promise.resolve();
          }
          build = toStandardBuildConfig(build);

          return fs.writeFile(filePath, JSON.stringify(build));
        });

        await Promise.all(writeFilePromises);

        downloaded += builds.length;
        spinner.text = chalk`Downloaded data for {green ${downloaded}} builds of {green ${totalBuilds}} builds`;
        downloadHook && downloadHook(downloaded, totalBuilds);
      })
    );
  }

  await Promise.all(requestPromises);

  spinner.succeed(
    chalk`Download completed. Total Builds: {green ${totalBuilds}}`
  );
}

exports.download = fetchBitbucketPipelines;
