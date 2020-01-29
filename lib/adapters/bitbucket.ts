"use strict";

import chalk from "chalk";
import pLimit from "p-limit";
import got from "got";
import ora from "ora";
import path from "path";
import { getLastDownloadedBuildNumber } from "../utils/builds";
import fs from "../utils/fs";

const getBaseUrl = (user: string, repo: string) =>
  `https://api.bitbucket.org/2.0/repositories/${user}/${repo}/pipelines/`;

const toStandardBuildConfig = build => ({
  id: build.build_number,
  uuid: build.uuid,
  createdOn: build.created_on,
  duration: build.duration_in_seconds,
  result: build.state.result.name,
  refType: build.target.ref_type,
  refName: build.target.ref_name
});

async function getTotalBuilds(user: string, repo: string, { auth }: { auth: string }): Promise<number> {
  let res = await got(getBaseUrl(user, repo), { auth });
  let resJson = JSON.parse(res.body);
  return resJson.size;
}

interface DownloadOptions {
  auth: string;
  concurrency: string | number;
  downloadHook?: Function;
  repo: string;
  since: string;
  user: string
}

export default async function fetchBitbucketPipeline(
  buildsDir: string,
  { auth, concurrency, downloadHook, repo, since, user }: DownloadOptions
) {
  const totalBuilds: number = await getTotalBuilds(user, repo, { auth });
  const spinner = ora().start("Initializing download");
  const pagelen = 100;
  const limit = pLimit(concurrency); // limits the number of concurrent requests
  const lastDownloaded: number = !isNaN(Number(since)) ? Number(since) : await getLastDownloadedBuildNumber(buildsDir);
  const startingBuild: number = lastDownloaded ? lastDownloaded + 1 : 1;
  const startPage = Math.floor(startingBuild / pagelen) + 1;
  const endPage = Math.floor(totalBuilds / pagelen) + 1;

  let downloaded = startingBuild - 1;
  let requestPromises = [];

  spinner.text = "Starting download";

  for (let page = startPage; page <= endPage; page++) {
    let url = `${getBaseUrl(
      user,
      repo
    )}?pagelen=${pagelen}&page=${page}&sort=created_on`;
    requestPromises.push(
      limit(async () => {
        let res = await got(url, { auth });
        let resJson = JSON.parse(res.body);
        let builds = resJson.values;

        let writeFilePromises = builds.map(build => {
          let filePath = path.join(buildsDir, `${build.build_number}.json`);

          if (
            build.state.name !== "COMPLETED" ||
            build.trigger.name === "SCHEDULE"
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
