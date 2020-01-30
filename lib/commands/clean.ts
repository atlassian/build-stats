import rimraf from "rimraf-promise";
import chalk from "chalk";
import ora from "ora";
import * as builds from "../utils/builds";
import adapters from "../adapters";

export default async function clean({ cwd, host, user, repo }) {
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
