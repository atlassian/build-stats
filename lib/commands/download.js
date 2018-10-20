'use strict';
const builds = require('../utils/builds');
const adapters = require('../adapters');

async function download(
  { cwd, host, user, repo, auth, concurrency, since },
  downloadHook
) {
  let buildsDir = await builds.getBuildDir(cwd, host, user, repo);
  let adapter = adapters[host];

  if (adapter) {
    await adapter.download(buildsDir, {
      auth,
      concurrency,
      downloadHook,
      since
    });
  } else {
    throw new Error(`Unknown CI service: ${host}`);
  }
}

module.exports = download;
