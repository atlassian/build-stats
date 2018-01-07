"use strict";
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const leftPad = require("left-pad");
const { promisify } = require("util");
const groupBy = require("lodash.groupby");

const mkdir = promisify(fs.mkdir);
const readDir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);

const GRAPH_MAX_LENGTH = 15;
const TWENTY_MINS_IN_SECS = 60 * 20;

function daysToMs(days) {
  return 1000 * 60 * 60 * 24 * days;
}

function withinLast(days, period, build) {
  const now = Date.now();
  let buildDateTime = +new Date(build.started_at);
  let daysInMs = daysToMs(days * period);

  return buildDateTime > now - daysInMs;
}

function withInDays(a, b, days) {
  let aTime = +new Date(a.started_at);
  let bTime = +new Date(b.started_at);

  return aTime - bTime < daysToMs(days);
}

function calculateGroup(builds) {
  let totalBuilds = builds.length;
  let totalDuration = 0;

  for (let build of builds) {
    totalDuration += build.duration;
  }

  let buildDurationMean = totalDuration / totalBuilds;

  return {
    totalBuilds,
    buildDurationMean
  };
}

function getRange(data) {
  let max = TWENTY_MINS_IN_SECS;
  let min = TWENTY_MINS_IN_SECS;

  data.forEach(build => {
    if (build["0"]) {
      max = Math.max(max, build["0"].buildDurationMean);
      min = Math.min(min, build["0"].buildDurationMean);
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

async function travisCalculate(builds, period = 1, last = 30) {
  let sorted = builds.sort((a, b) => {
    return +new Date(b.started_at) - +new Date(a.started_at);
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

  let graphRange = getRange(data.ranges);

  data.ranges.map(
    range =>
      range["0"] &&
      console.log(
        `Mean build Time: ${chalk.green(
          leftPad((range["0"].buildDurationMean / 60).toFixed(2), 5, "0")
        )} mins ${getBar(range["0"].buildDurationMean, graphRange)}`
      )
  );
}

module.exports = travisCalculate;
