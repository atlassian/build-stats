'use strict';
const leftPad = require('left-pad');
const chalk = require('chalk');
const format = require('date-fns/format');
const constants = require('../constants');

function id(num) {
  return `#${num}`;
}

function duration(dur) {
  return `${leftPad((dur / 60).toFixed(2), 8, '')} min`;
}

function bar(value, min, max) {
  let distance = max - min;
  // edge-case if there is only one build, => min === max
  distance = Math.max(1, distance);
  let unit = constants.GRAPH_MAX_LENGTH / distance;
  let length = Math.ceil((value - min) * unit);
  let bar = '█' + new Array(length).join('█') + new Array(15).join(' ');

  if (length > constants.GRAPH_MAX_LENGTH / 2) {
    return chalk.red(bar);
  } else {
    return chalk.green(bar);
  }
}

function result(res) {
  if (res === 'SUCCESSFUL') return chalk.green(res);
  if (res === 'FAILED') return chalk.red(res);
  return chalk.yellow(res);
}

function date(dateStr) {
  return format(new Date(dateStr), 'ddd, DD/MM/YYYY HH:mm:ss');
}

function dateRange(start, end) {
  return format(start, 'DD/MM/YYYY') + '-' + format(end, 'DD/MM/YYYY');
}

function ref(refType, refName) {
  return `${refType} = ${refName}`;
}

module.exports = {
  id,
  duration,
  bar,
  result,
  date,
  dateRange,
  ref,
};
