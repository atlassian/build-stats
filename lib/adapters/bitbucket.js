'use strict';
const got = require('got');
const path = require('path');
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
  let total = 0;
  let numberOfPages = 0;

  outer:
  do {
    let res = await got(`https://api.bitbucket.org/2.0/repositories/${user}/${repo}/pipelines/?pagelen=${pagelen}&page=${page}&sort=-created_on`, {
      auth
    });
    let json = JSON.parse(res.body);
    let builds = json.values;

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

    total = json.size;
    numberOfPages = parseInt(total / pagelen) + 1;
    console.log(`Page: ${json.page} of ${numberOfPages}, Total Builds: ${json.size}`);
    downloadHook && downloadHook(json.page, son.size);
    page++;
  } while ((page - 1) * 100 < total);
}

exports.download = fetchBitbucketPipelines;
