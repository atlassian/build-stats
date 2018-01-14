#!/usr/bin/env node
'use strict';
const meow = require('meow');
const { calculate, download, history } = require('./');

async function main(argv) {
  const cli = meow({
    argv,
    help: `
      Usage
        $ build-stats <service>:<user>/<repo> <command> [...opts]

      Commands
        download         Download history for a repository
        calculate        Calculate average build time and success rates over time
        history          List individual builds

      Options
        --auth   [authentication]  (download) Authentication to access private repo
        --branch [name]            (calculate/history) Which branch(es) to display (Comma-separated list) (Default: *)
        --result [name]            (calculate/history) Which branch(es) to display (Comma-separated list) (Default: *)
        --period [days]            (calculate) How many days in a time period to calculate the means for (Default: 1)
        --last   [count]           (calculate) How many periods to calculate back to (Default: 30)

      Services
        - bitbucket      Bitbucket Pipelines
        - travis         Travis CI

      Examples
        Download pipelines builds history to .data folder:
        $ build-stats travis:boltpkg/bolt download

        Download pipelines builds history to .data folder for private repository:
        $ build-stats travis:boltpkg/bolt download --auth <token>

        Calculate monthly average build time and success rate of a repo over the last year
        $ build-stats travis:boltpkg/bolt calculate

        Calculate daily average build time and success rate of a repo over the last month
        $ build-stats travis:boltpkg/bolt calculate --period 1 --last 30

        Calculate daily average build time and success rate of the master branch of a repo over the last 90 days
        $ build-stats travis:boltpkg/bolt calculate --branch master --period 1 --last 90

        Display build history
        $ build-stats travis:boltpkg/bolt history

        Display build history for master branch for builds that were either successful or failed
        $ build-stats travis:boltpkg/bolt history --branch master --result SUCCESSFUL,FAILED
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
      auth: flags.auth
    });
  } else if (command === 'calculate') {
    await calculate({
      cwd,
      host,
      user,
      repo,
      branch: flags.branch,
      result: flags.result,
      period: flags.period ? parseInt(flags.period, 10) : undefined,
      last: flags.last ? parseInt(flags.last, 10) : undefined,
      json: flags.json
    });
  } else if (command === 'history') {
    await history({
      cwd,
      host,
      user,
      repo,
      branch: flags.branch,
      result: flags.result,
      json: flags.json
    });
  } else {
    throw new Error(`Unknown command "${command}", should be "download" or "calculate"`);
  }
}

main(process.argv.slice(2)).catch(err => {
  console.error(err);
  process.exit(1);
});
