'use strict';
const groupBy = require('lodash.groupby');
const cli = require('../utils/cli');
const math = require('../utils/math');
const formatters = require('../utils/formatters');
const builds = require('../utils/builds');
const leftPad = require('left-pad');

function calculateGroup(group) {
  let totalBuilds = group.length;
  let start = new Date(group[totalBuilds - 1].createdOn);
  let end = new Date(group[0].createdOn);
  let durations = group.map(build => build.duration);
  let buildDurationMean = math.getMean(durations);
  let buildPercentileMean = math.getPercentileMean(durations, 95);
  let longestBuild = builds.findLongest(group);

  return {
    totalBuilds,
    start,
    end,
    buildDurationMean,
    buildPercentileMean,
    longestBuild,
  };
}

function calculateRanges(ranges) {
  return ranges.map(range => {
    let result = {};
    let groups = groupBy(range, build => build.result);

    result.ALL = calculateGroup(range);
    for (let groupName of Object.keys(groups)) {
      result[groupName] = calculateGroup(groups[groupName]);
    }

    return result;
  });
}

async function success({
  cwd,
  host,
  user,
  repo,
  branch = '*',
  result = '*',
  period = 1,
  last = 30,
  json = false
}) {
  let history = await builds.getHistory(cwd, host, user, repo, {
    branch,
    result
  });
  let ranges = builds.toTimeRanges(history, { period, last });
  let results = calculateRanges(ranges);

  if (json) {
    console.log(results);
  } else {
    console.log(
      cli.table({
        columns: ['', 'Date Range (DD/MM/YYY)', 'Total Builds', 'Failed Builds', 'Successful Builds', ''],
        rows: results.map((range, index) => {
          const FAILED_BUILDS = range.FAILED ? range.FAILED.totalBuilds : 0;
          const SUCCESSFUL_BUILDS = range.SUCCESSFUL
            ? range.SUCCESSFUL.totalBuilds
            : 0;
          const FAILED_BUILDS_MEAN = range.FAILED
            ? range.FAILED.buildPercentileMean
            : 0;
          const SUCCESSFUL_BUILDS_MEAN = range.SUCCESSFUL
            ? range.SUCCESSFUL.buildPercentileMean
            : 0;
          return [
            index + 1,
            formatters.dateRange(range.ALL.start, range.ALL.end),
            FAILED_BUILDS + SUCCESSFUL_BUILDS,
            FAILED_BUILDS,
            SUCCESSFUL_BUILDS,
            formatters.singleBar(SUCCESSFUL_BUILDS, FAILED_BUILDS)
          ];
        })
      })
    );
  }

  return results;
}

module.exports = success;
