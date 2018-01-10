'use strict';
const groupBy = require('lodash.groupby');
const cli = require('../utils/cli');
const math = require('../utils/math');
const formatters = require('../utils/formatters');
const builds = require('../utils/builds');

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

async function calculate({
  cwd,
  host,
  user,
  repo,
  branch = '*',
  result = '*',
  period = 1,
  last = 30
}) {
  let history = await builds.getHistory(cwd, host, user, repo, { branch, result });
  let ranges = builds.toTimeRanges(history, { period, last });
  let results = calculateRanges(ranges);

  let successfulRanges = results.filter(range => !!range.SUCCESSFUL);
  let durationMeans = successfulRanges.map(range => range.SUCCESSFUL.buildDurationMean);
  let { min, max } = math.getMinMax(durationMeans);

  console.log(cli.table({
    columns: ['', 'Date Range (DD/MM/YYY)', 'Total Builds', 'Mean', 'Mean (95%)', 'Longest', ''],
    rows: successfulRanges.map((range, index) => {
      return [
        (index + 1),
        formatters.dateRange(range.SUCCESSFUL.start, range.SUCCESSFUL.end),
        range.SUCCESSFUL.totalBuilds,
        formatters.duration(range.SUCCESSFUL.buildDurationMean),
        formatters.duration(range.SUCCESSFUL.buildPercentileMean),
        `${formatters.duration(range.SUCCESSFUL.longestBuild.duration)} (${formatters.id(range.SUCCESSFUL.longestBuild.id)})`,
        formatters.bar(range.SUCCESSFUL.buildPercentileMean, min, max)
      ];
    }),
  }));

  return results;
}

module.exports = calculate;
