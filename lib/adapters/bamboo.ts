import chalk from "chalk";
import pLimit from "p-limit";
import got from "got";
import ora from "ora";
import path from "path";
import * as fs from "../utils/fs";
import {
  getLastDownloadedBuildNumber
} from "../utils/builds";

/**
 * URL for build -> curl --user <userName>:<password> https://<url-to-bamboo>/rest/api/latest/result/<ProjectKey-<BuildKey>-latest.json
 */
function toStandardBuildConfig(build) {
  return {
    id: build.buildNumber,
    uuid: build.id,
    createdOn: build.buildStartedTime,
    duration: build.buildDurationInSeconds,
    result: build.buildState && build.buildState.toUpperCase(),
    refType: "not available",
    refName: "master"
  };
}

const bambooApiUrl = (bambooUrl, planKey) =>
  `https://${bambooUrl}/rest/api/latest/result/${planKey}`;

async function getTotalBuilds(bambooUrl, planKey, auth) {
  const bambooBuildUrl = bambooApiUrl(bambooUrl, planKey);
  // const bambooLatestBuild = `${bambooBuildUrl}.json?max-result=0`;
  const bambooLatestBuild = `${bambooBuildUrl}-latest.json`;
  let res = await got(bambooLatestBuild, {
    auth
  });
  let resJson = JSON.parse(res.body);
  return resJson.buildNumber;
}

export default async function bambooBuilds(
  buildsDir,
  { auth, concurrency, downloadHook, repo: planKey, since, user: bambooUrl }
) {
  let spinner = ora().start("Initializing download");
  const limit = pLimit(concurrency);
  let lastDownloaded = since;
  if (lastDownloaded == undefined) {
    lastDownloaded = await getLastDownloadedBuildNumber(buildsDir);
  }
  let startingBuild = lastDownloaded ? lastDownloaded + 1 : 1;
  let totalBuilds = await getTotalBuilds(bambooUrl, planKey, auth);
  let downloaded = startingBuild - 1;
  spinner.text = "Starting download";

  let requestPromises = [];
  /**
   * Bamboo is a special case:
   * Data for old build can be deleted for Bamboo: https://confluence.atlassian.com/bamboo/deleting-the-results-of-a-plan-build-289276916.html
   * so there can be gaps in the build numbers
   */

  // Get data for all the available buils
  let urlGetAllBuilds = `${bambooApiUrl(
    bambooUrl,
    planKey
  )}.json?max-result=0`;

  let res = await got(urlGetAllBuilds, { auth });
  let resJson = JSON.parse(res.body);
  const allBuildData = resJson?.results?.result;

  for (let buildData in allBuildData) {
    limit(async () => {
      let build = toStandardBuildConfig(buildData);
      let filePath = path.join(buildsDir, `${build.id}.json`);
  
      downloaded += 1;
      spinner.text = chalk`Downloaded data for {green ${downloaded}} builds of {green ${totalBuilds}} builds`;
      downloadHook && downloadHook(downloaded, totalBuilds);

      return fs.writeFile(filePath, JSON.stringify(build));
    });
  }

  await Promise.all(requestPromises);

  spinner.succeed(
    chalk`Download completed. Total Builds: {green ${totalBuilds}}`
  );
  console.log(totalBuilds);
  spinner.stop();
  return;
}
