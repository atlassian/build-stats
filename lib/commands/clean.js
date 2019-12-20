"use strict";
const rimraf = require("rimraf-promise");
const chalk = require("chalk");
const ora = require("ora");
const builds = require("../utils/builds");
const adapters = require("../adapters");

async function clean({ cwd, host, user, repo }) {
  let buildsDir = await builds.getBuildDir(cwd, host, user, repo);
  const spinner = ora({
    text: `Starting clean`
  }).start();

  try {
    await rimraf(buildsDir);
    spinner.succeed(`Clean completed.`);
  } catch (error) {
    spinner.fail(chalk`Failed to clean with error {red ${error}}`);
  }
}

module.exports = clean;
