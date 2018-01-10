"use strict";
const { getHistory, formatDuration, formatPipe, GRAPH_MAX_LENGTH, TWENTY_MINS_IN_SECS } = require("./util");
const Table = require('cli-table');
const stringToStream = require('string-to-stream');
const pager = require('default-pager');
const chalk = require('chalk');
const format = require('date-fns/format');



function formatResult(result) {
  if (result === 'SUCCESSFUL') return chalk.green(result);
  if (result === 'FAILED') return chalk.red(result);
  return chalk.yellow(result);
}

function formatDate(dateStr) {
  return format(new Date(dateStr), 'ddd, MM/DD/YYYY HH:mm:ss');
}

function getRange(history) {

  return {
    min,
    max
  };
}

async function history({ cwd, host, user, repo, branch = '*', result = '*' }) {
  let history = await getHistory(cwd, host, user, repo, { branch, result });

  let table = new Table({
    head: ['Build', 'Date', 'Duration', 'Result', '', 'Trigger'],
  });

  let max = null;
  let min = null;

  history.forEach(build => {
    let duration = build.duration;
    max = max !== null ? Math.max(max, duration) : duration;
    min = min !== null ? Math.min(min, duration) : duration;
  });

  min = min || 0;
  max = max || 0;

  history.forEach(item => {
    table.push([
      `#${item.id}`,
      formatDate(item.createdOn),
      formatDuration(item.duration),
      formatResult(item.result),
      formatPipe(item.duration, min, max),
      `${item.refType} = ${item.refName}`,
    ]);
  });

  stringToStream(table.toString()).pipe(pager());
}

module.exports = history;
