'use strict';
const chalk = require('chalk');
const got = require('got');
const ora = require('ora');
const pLimit = require('p-limit');
const path = require('path');
const fs = require('../utils/fs');
const { getBuildDir } = require('../utils/builds');

const RESULT_TO_STATUS = {
  '0': 'SUCCESSFUL',
  '1': 'FAILED'
};

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

// Knowing which url to use can be a pain. It can change depending on a few things:
function getTravisUrl(user, repo, apiVersion, auth) {
  // if looking for a public (open source) build, we use travis-ci.org
  // otherwise, we use travis-ci.com
  const baseUrl = auth ? 'https://api.travis-ci.com' : 'https://api.travis-ci.org';
  if (apiVersion === 3) {
    // v3 requires repo slug to be urlEncoded and uses 'repo' instead of 'repos'
    let repoSlug = encodeURIComponent(`${user}/${repo}`);
    return `${baseUrl}/repo/${repoSlug}/builds`
  }
  let repoSlug = `${user}/${repo}`;
  return `${baseUrl}/repos/${repoSlug}/builds`;
}

async function getLastDownloaded(buildsDir) {
  let currentlyDownloaded = await fs.readDir(buildsDir);
  let lastDownloaded = currentlyDownloaded.filter(file => file.match(/^.+?\.json$/))
    .map(file => file.replace('.json', ''))
    .map(numStr => parseInt(numStr, 10))   // convert to integers
    .sort((a, b) => a - b)                 // sort ascending (default sort )
    .pop();                                // get the last (largest)

    return lastDownloaded || 0;
}

async function getTotalBuilds(user, repo, auth) {
  // To get the total number of builds, we'll use the 3.0 API because it's the easiest to find this
  // information https://developer.travis-ci.com/resource/builds#Builds
  // We get the 3.0 api by using the "Travis-API-Version: 3" header
  const url = getTravisUrl(user, repo, 3, auth);
  const res = await got(url, {
    headers: {
      'Travis-API-Version': 3,
    }
  });
  const resJson = JSON.parse(res.body);

  return resJson['@pagination'].count;
}

async function fetchPipelines(buildsDir, user, repo, auth, downloadHook) {
  const pageLen = 25;

  const totalBuilds = await getTotalBuilds(user, repo, auth);
  const lastDownloaded = await getLastDownloaded(buildsDir);
  // "pages" move backwards, so by starting at offset 26 for example, we'll get builds 1-25
  const startingOffset = Math.floor(lastDownloaded / pageLen) * pageLen + pageLen + 1;
  const finalOffset = Math.floor(totalBuilds / pageLen) * pageLen + pageLen + 1;

  let limit = pLimit(10) // limits us to running no more than 10 at a time
  let downloaded = lastDownloaded;
  let requestPromises = [];
  const spinner = ora().start('Starting download');

  for (let offset = startingOffset; offset <= finalOffset; offset += pageLen) {
    const request = limit(async () => {
      let url = getTravisUrl(user, repo, 2, auth) + `?after_number=${offset}`;
      if (auth) {
        // This seems mostly undocumented, except here
        // https://blog.travis-ci.com/2013-01-28-token-token-token
        url += `token=${auth}`;
      }
      let res = await got(url);
      let builds = JSON.parse(res.body);

      let fsPromises = builds.map(build => {
        let stdBuild = toStandardBuildConfig(build);

        let filePath = path.join(buildsDir, `${stdBuild.id}.json`);
        return fs.writeFile(filePath, JSON.stringify(stdBuild));
      });

      await Promise.all(fsPromises);

      downloaded += pageLen;
      spinner.text = chalk`Downloaded data for {green ${downloaded}} builds of {green ${totalBuilds}} builds`;
      downloadHook && downloadHook(downloaded, totalBuilds);
    });
    requestPromises.push(request);
  }

  await Promise.all(requestPromises);

  spinner.succeed(chalk`Download completed. Total Builds: {green ${totalBuilds}}`);
}

exports.download = fetchPipelines;
