#!/usr/bin/env node
'use strict';
const meow = require('meow');
const { calculate, download } = require('./');

async function main(argv) {
  const cli = meow({
    argv,
    help: `
      Usage
        $ build-stats [user]/[repo] [command] <...args> <...opts>

      Commands
        download         Download history for a repository
        calculate        Calculate average build time and success rates over time

      Options
        --branch [name]  (stats) Which branch to display stats for (Default: *)
        --period [days]  (stats) How many days in a time period to calculate the means for (Default: 1)
        --last [count]   (stats) How many periods to calculate back to (Default: 30)

      Examples
        Download pipelines builds history to .data folder:
        $ build-stats bitbucket:user/repo download

        Calculate monthly average build time and success rate of a repo over the last year
        $ build-stats bitbucket:user/repo calculate

        Calculate daily average build time and success rate of a repo over the last month
        $ build-stats bitbucket:user/repo calculate --period 1 --last 30

        Calculate daily average build time and success rate of the master branch of a repo over the last 90 days
        $ build-stats bitbucket:user/repo calculate --branch master --period 1 --last 90
    `
  });

  if (cli.input.length < 2) {
    cli.showHelp();
  }

  let match = cli.input[0].match(/(.*):(.*)\/(.*)/);

  if (!match) {
    throw new Error(`Invalid repo "${cli.input[0]}", should be "host:user/repo"`);
  }

  let [,host, user, repo] = match;
  let command = cli.input[1];
  let flags = cli.flags;
  let cwd = process.cwd();

  if (command === 'download') {
    await download({
      cwd,
      host,
      user,
      repo,
    });
  } else if (command === 'calculate') {
    await calculate({
      cwd,
      host,
      user,
      repo,
      branch: flags.branch,
      period: flags.period ? parseInt(flags.period, 10) : undefined,
      last: flags.last ? parseInt(flags.last, 10) : undefined,
    });
  } else {
    throw new Error(`Unknown command "${command}", should be "download" or "calculate"`);
  }
}

main(process.argv.slice(2)).catch(err => {
  console.error(err);
  process.exit(1);
});
