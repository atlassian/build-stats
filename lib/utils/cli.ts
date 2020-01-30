"use strict";
import Table from "cli-table";
import stringToStream from "string-to-stream";
import defaultPager from "default-pager";

export function table({ columns, rows }) {
  let table = new Table({ head: columns });
  table.push(...rows);
  return table.toString();
}

export function pager(str) {
  return stringToStream(str).pipe(defaultPager());
}
