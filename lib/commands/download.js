'use strict';
const builds = require('../utils/builds');
const HOSTS = require('../ci');

async function download({ cwd, host, user, repo }) {
  let buildsDir = await builds.getBuildDir(cwd, host, user, repo);
  let hostDownload = HOSTS[host];

  if (hostDownload) {
    await hostDownload(buildsDir, user, repo);
  } else {
    throw new Error(`Unknown CI service: ${host}`);
  }
}

module.exports = download;
