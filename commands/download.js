"use strict";
const { getBuildDir } = require("./util");
const bitbucketDownload = require("../ci/bitbucket/bitDownload");
const fetchTravisPipelines = require("../ci/travis/travisDownload");

async function download({ cwd, host, user, repo }) {
  let buildsDir = await getBuildDir(cwd, host, user, repo);
  switch (host) {
    case "bitbucket":
      await bitbucketDownload(buildsDir, user, repo);
      break;
    case "travis":
      await fetchTravisPipelines(buildsDir, user, repo);
      break;
  }
}

module.exports = download;
