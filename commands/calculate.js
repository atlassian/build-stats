"use strict";
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const { promisify } = require("util");
const { getBuildDir } = require("./util");
const groupBy = require("lodash.groupby");
const leftPad = require("left-pad");
const Table = require('cli-table');
const hyperlinker = require('hyperlinker');

const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const GRAPH_MAX_LENGTH = 15;
const TWENTY_MINS_IN_SECS = 60 * 20;

function daysToMs(days) {
  return 1000 * 60 * 60 * 24 * days;
}

function withInDays(a, b, days) {
  let aTime = +new Date(a.createdOn);
  let bTime = +new Date(b.createdOn);

  return aTime - bTime < daysToMs(days);
}

function withinLast(days, period, build) {
  const now = Date.now();
  let buildDateTime = +new Date(build.createdOn);
  let daysInMs = daysToMs(days * period);

  return buildDateTime > now - daysInMs;
}

function getPercentileMean(dataSet, percentile) {
  let sortedDataSet = dataSet.sort((a, b) => a - b);
  let dataSetLength = sortedDataSet.length;
  let elementToPick = Math.floor((percentile / 100) * dataSetLength);
  let newDataSet = sortedDataSet.slice(0, elementToPick);
  let total = 0;
  newDataSet.forEach(data => { total += data });

  return total / newDataSet.length;
}

function calculateGroup(builds) {
  let totalBuilds = builds.length;
  let totalDuration = 0;
  let longestBuild = {
    duration: 0,
  }

  for (let build of builds) {
    totalDuration += build.duration;
    if (build.duration > longestBuild.duration) {
      longestBuild.duration = build.duration;
      longestBuild.buildNum = build.id;
    }
  }

  let buildDurationMean = totalDuration / totalBuilds;

  let startDate = new Date(builds[totalBuilds - 1].createdOn);
  let endDate = new Date(builds[0].createdOn);

  let dateRange = [
    `${leftPad(startDate.getDate(), 2, '0')}/${leftPad(startDate.getMonth() + 1, 2, '0')}/${startDate.getFullYear()}`,
    `${leftPad(endDate.getDate(), 2, '0')}/${leftPad(endDate.getMonth() + 1, 2, '0')}/${endDate.getFullYear()}`
  ];

  let percentile = getPercentileMean(builds.map(build => build.duration), 95);

  return {
    totalBuilds,
    buildDurationMean,
    longestBuild,
    dateRange,
    percentile
  };
}

function getRange(data) {
  let max = TWENTY_MINS_IN_SECS;
  let min = TWENTY_MINS_IN_SECS;

  data.forEach(build => {
    if (build.SUCCESSFUL) {
      max = Math.max(max, build.SUCCESSFUL.buildDurationMean);
      min = Math.min(min, build.SUCCESSFUL.buildDurationMean);
    }
  });

  return {
    min,
    max
  };
}

function getBar(data, range) {
  let distance = range.max - range.min;
  let unit = GRAPH_MAX_LENGTH / distance;
  let length = Math.floor((data - range.min) * unit);
  if (length > GRAPH_MAX_LENGTH / 2) {
    return `${chalk.red("█" + new Array(length).join("█"))}`;
  }

  return `${chalk.green("█" + new Array(length).join("█"))}`;
}

async function calculate({
  cwd,
  host,
  user,
  repo,
  branch = "*",
  period = 1,
  last = 30
}) {
  let buildsDir = await getBuildDir(cwd, host, user, repo);
  let files = await readDir(buildsDir);
  let builds = [];

  for (let fileName of files) {
    let filePath = path.join(buildsDir, fileName);
    let fileContents = await readFile(filePath);
    let build = JSON.parse(fileContents);
    builds.push(build);
  }

  let sorted = builds.sort((a, b) => {
    return +new Date(b.createdOn) - +new Date(a.createdOn);
  });

  let queue = sorted.slice();

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

  // instantiate 
  var table = new Table({
    head: ['Date Range (DD/MM/YYY)', 'Total Builds', 'Mean', 'Mean (95%)', 'Longest', '']
    , colWidths: [30, 15, 15, 15, 20, 30]
  });

  // console.log(data.ranges[0]);

  data.ranges.map(range =>
    range.SUCCESSFUL &&
    table.push([
      range.SUCCESSFUL.dateRange.join('-'),
      range.SUCCESSFUL.totalBuilds,
      `${leftPad((range.SUCCESSFUL.buildDurationMean / 60).toFixed(2), 5, "0")} min`,
      `${leftPad((range.SUCCESSFUL.percentile / 60).toFixed(2), 5, "0")} min`,
      `${leftPad((range.SUCCESSFUL.longestBuild.duration / 60).toFixed(2), 5, "0")} min #${range.SUCCESSFUL.longestBuild.buildNum}`,
      getBar(range.SUCCESSFUL.buildDurationMean, barRange)
    ])
  );

  console.log(table.toString());

}

module.exports = calculate;
