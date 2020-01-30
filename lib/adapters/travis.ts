"use strict";
import chalk from "chalk";
import got from "got";
import ora from "ora";
import pLimit from "p-limit";
import path from "path";
import * as fs from "../utils/fs";
import { getLastDownloadedBuildNumber } from "../utils/builds";

const RESULT_TO_STATUS = {
  "0": "SUCCESSFUL",
  "1": "FAILED"
};

function toStandardBuildConfig(build) {
  return {
    id: build.number,
    uuid: build.id,
    createdOn: build.started_at,
    duration: build.duration,
    result: RESULT_TO_STATUS[build.result] || "STOPPED",
    refType: build.event_type,
    refName: build.branch
  };
}

// Knowing which url to use can be a pain. It can change depending on a few things:
function getTravisUrl(user: string, repo: string, apiVersion: number, auth: string) {
  // if looking for a public (open source) build, we use travis-ci.org
  // otherwise, we use travis-ci.com
  let baseUrl = auth
    ? "https://api.travis-ci.com"
    : "https://api.travis-ci.org";
  if (apiVersion === 3) {
    // v3 requires repo slug to be urlEncoded and uses 'repo' instead of 'repos'
    let repoSlug = encodeURIComponent(`${user}/${repo}`);
    return `${baseUrl}/repo/${repoSlug}/builds`;
  }
  let repoSlug = `${user}/${repo}`;
  return `${baseUrl}/repos/${repoSlug}/builds`;
}

async function getTotalBuilds(user, repo, auth) {
  // To get the total number of builds, we'll use the 3.0 API because it's the easiest to find this
  // information https://developer.travis-ci.com/resource/builds#Builds
  // We get the 3.0 api by using the "Travis-API-Version: 3" header
  let url = getTravisUrl(user, repo, 3, auth);
  let res = await got(url, {
    headers: {
      "Travis-API-Version": 3
    }
  });
  let resJson = JSON.parse(res.body);

  return resJson["@pagination"].count;
}

interface DownloadOptions {
  auth: string;
  concurrency: number;
  downloadHook?: Function;
  repo: string;
  since: number;
  user: string
}

export default async function fetchPipelines(
  buildsDir: string,
  { auth, concurrency, downloadHook, repo, since, user }: DownloadOptions
) {
  const pageLen = 25;
  const limit = pLimit(concurrency); // limits the number of concurrent requests
  let lastDownloaded = since ? since : await getLastDownloadedBuildNumber(buildsDir);

  let totalBuilds = await getTotalBuilds(user, repo, auth);
  // "pages" move backwards, so by starting at offset 26 for example, we'll get builds 1-25
  let startingOffset =
    Math.floor(lastDownloaded / pageLen) * pageLen + pageLen + 1;
  let finalOffset = Math.floor(totalBuilds / pageLen) * pageLen + pageLen + 1;

  let downloaded = lastDownloaded;
  let requestPromises = [];
  let spinner = ora().start("Starting download");

  for (let offset = startingOffset; offset <= finalOffset; offset += pageLen) {
    let request = limit(async () => {
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

  spinner.succeed(
    chalk`Download completed. Total Builds: {green ${totalBuilds}}`
  );
}
