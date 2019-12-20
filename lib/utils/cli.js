"use strict";
const Table = require("cli-table");
const stringToStream = require("string-to-stream");
const defaultPager = require("default-pager");

function table({ columns, rows }) {
  let table = new Table({ head: columns });
  table.push(...rows);
  return table.toString();
}

function pager(str) {
  return stringToStream(str).pipe(defaultPager());
}

module.exports = {
  table,
  pager
};
