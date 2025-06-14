![build-stats](https://raw.githubusercontent.com/ajaymathur/build-stats/master/assets/build-stats-banner.png)

---

> Get the stats of your pipeline.

![preview](https://raw.githubusercontent.com/ajaymathur/build-stats/master/assets/preview.png)

## Install

```sh
yarn global add build-stats
```

## Example

Download pipelines builds history to `.data` folder:

```sh
build-stats travis:boltpkg/bolt download
```

Calculate monthly average build time and success rate of a repo over the last year:

```sh
build-stats travis:boltpkg/bolt calculate
```

Calculate the daily average build time and success rate of a repo over the last month:

```sh
build-stats travis:boltpkg/bolt calculate --period 1 --last 30
```

Calculate the daily average build time and success rate of the master branch of a repo over the last 90 days:

```sh
$ build-stats travis:boltpkg/bolt calculate --branch master --period 1 --last 90
```

Display build history:

```sh
$ build-stats travis:boltpkg/bolt history
```

Display build history for master branch for builds that were either successul or failed:

```sh
$ build-stats travis:boltpkg/bolt history --branch master --result SUCCESSFUL,FAILED
```

Delete the downloaded history of repository

```sh
$ build-stats travis:boltpkg/bolt clean
```

## Usage

```sh
build-stats <service>:<user>/<repo> <command> [...options]
```

- `service`: CI Service (`travis` or `bitbucket` or `bamboo`)
- `user/repo`: Project specifier (Example: `https://travis-ci.org/boltpkg/bolt` &rarr; `boltpkg/bolt`)

\*\*Note: In case for Bamboo, user is the url to the Bamboo server and repo is the plankey of the project.

### Commands

#### `download`

Download the build history into a local `.data` cache.

- `--auth <token>`: Authentication token to access builds on private repository. Please read [GENERATING_AUTH_TOKENS.md](GENERATING_AUTH_TOKENS.md) to see how to generate authentication token.

#### `calculate`

Calculate the mean and see the stats of build history

- `--period <days>`: How many days in a time period to calculate the build stats for (**Default: 1**)
- `--last <days>`: How many periods to calculate back to (**Default: 30**)
- `--threshold <minutes>`: Time under which builds graph is shown in green color. (**Default: mean of all the builds in that period**)

#### `history`

Display build history

- `--branch <branchName>`: Name of the branch to show history for (**Defualt: (\*)**)
- `--result <SUCCESSFUL | FAILED | STOPPPED | any>`: Result of the branch to show history for. We can display history for multiple results by seperating them with a comma(,). To see history for builds that were either successful or failed use `--result SUCCESSFUL,FAILED` (**Default: (\*)**)
- `--threshold <minutes>`: Time under which builds graph is shown in green color. (**Default: mean of all the builds in that period**)

#### `success`

Display the number of success and failed builds

- `--period <days>`: How many days in a time period to display success stats for (**Default: 1**)
- `--last <days>`: How many periods to display success stats for (**Default: 30**)

#### `clean`

Delete the downloaded history of repository

#### cache

Outputs the directory where data will be cached
