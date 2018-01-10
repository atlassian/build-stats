"use strict";
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const Table = require('cli-table');
const leftPad = require("left-pad");
const { promisify } = require("util");
const groupBy = require("lodash.groupby");

const { daysToMs, withInDays, withinLast, getHistory, formatDuration, formatPipe, GRAPH_MAX_LENGTH, TWENTY_MINS_IN_SECS } = require("./util");

const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

function getPercentileMean(dataSet, percentile) {
  let total = 0;
  let sortedDataSet = dataSet.sort((a, b) => a - b);
  let dataSetLength = sortedDataSet.length;
  let elementToPick = Math.floor((percentile / 100) * dataSetLength);

  // guard in case there is only one build in that period
  elementToPick = Math.max(1, elementToPick);
  let newDataSet = sortedDataSet.slice(0, elementToPick);
  newDataSet.forEach(data => { total += data });

  return total / newDataSet.length;
}

function calculateGroup(builds) {
  let totalDuration = 0;
  let longestBuild = {
    duration: 0,
  };
  let totalBuilds = builds.length;

  for (let build of builds) {
    totalDuration += build.duration;
    if (build.duration > longestBuild.duration) {
      longestBuild.duration = build.duration;
      longestBuild.buildNum = build.id;
    }
  }

  let buildDurationMean = totalDuration / totalBuilds;
  let buildPercentileMean = getPercentileMean(builds.map(build => build.duration), 95);

  let startDate = new Date(builds[totalBuilds - 1].createdOn);
  let endDate = new Date(builds[0].createdOn);

  let dateRange = [
    `${leftPad(startDate.getDate(), 2, '0')}/${leftPad(startDate.getMonth() + 1, 2, '0')}/${startDate.getFullYear()}`,
    `${leftPad(endDate.getDate(), 2, '0')}/${leftPad(endDate.getMonth() + 1, 2, '0')}/${endDate.getFullYear()}`
  ];

  return {
    dateRange,
    buildDurationMean,
    buildPercentileMean,
    longestBuild,
    totalBuilds
  };
}

function getRange(data) {
  let max = TWENTY_MINS_IN_SECS;
  let min = TWENTY_MINS_IN_SECS;

  data.forEach(build => {
    if (build.SUCCESSFUL) {
      max = Math.max(max, build.SUCCESSFUL.buildPercentileMean);
      min = Math.min(min, build.SUCCESSFUL.buildPercentileMean);
    }
  });

  return {
    min,
    max
  };
}

function getBar(data, range) {
  return formatPipe(data, range.min, range.max);
  // let distance = range.max - range.min;
  // let unit = GRAPH_MAX_LENGTH / distance;
  // let length = Math.ceil((data - range.min) * unit);
  // if (length > GRAPH_MAX_LENGTH / 2) {
  //   return `${chalk.red("█" + new Array(length).join("█"))}`;
  // }
  //
  // return `${chalk.green("█" + new Array(length).join("█"))}`;
}

async function calculate({
  cwd,
  host,
  user,
  repo,
  branch = "*",
  result = "*",
  period = 1,
  last = 30
}) {
  let queue = await getHistory(cwd, host, user, repo, { branch, result });
  let ranges = [];

  while (queue.length) {
    let range = [];
    let first = queue.shift();

    if (!withinLast(last, period, first)) {
      break;
    }

    range.push(first);

    while (queue[0] && withInDays(first, queue[0], period)) {
      range.push(queue.shift());
    }

    ranges.push(range);
  }

  let data = { ranges: [] };

  for (let range of ranges) {
    let rangeData = {};

    rangeData.ALL = calculateGroup(range);

    let groups = groupBy(range, build => build.result);

    for (let groupName of Object.keys(groups)) {
      rangeData[groupName] = calculateGroup(groups[groupName]);
    }

    data.ranges.push(rangeData);
  }

  let barRange = getRange(data.ranges);

  var table = new Table({
    head: ['', 'Date Range (DD/MM/YYY)', 'Total Builds', 'Mean', 'Mean (95%)', 'Longest', ''],
  });

  data.ranges.map((range, index) =>
    range.SUCCESSFUL &&
    table.push([
      (index + 1),
      range.SUCCESSFUL.dateRange.join(' - '),
      range.SUCCESSFUL.totalBuilds,
      formatDuration(range.SUCCESSFUL.buildDurationMean),
      formatDuration(range.SUCCESSFUL.buildPercentileMean),
      `${formatDuration(range.SUCCESSFUL.longestBuild.duration)} (#${range.SUCCESSFUL.longestBuild.buildNum})`,
      getBar(range.SUCCESSFUL.buildPercentileMean, barRange)
    ])
  );

  console.log(table.toString());
}

module.exports = calculate;
