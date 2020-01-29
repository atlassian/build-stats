"use strict";
import builds from "../utils/builds";
import math from "../utils/math";
import formatters from "../utils/formatters";
import cli from "../utils/cli";

export default async function history({
  cwd,
  host,
  user,
  repo,
  threshold,
  branch = "*",
  result = "*",
  json = false
}) {
  let history = await builds.getHistory(cwd, host, user, repo, {
    branch,
    result
  });
  let durations = history.map(build => build.duration);
  let { min, max } = math.getMinMax(durations);
  if (threshold == undefined) {
    threshold = (math.getMean([min, max]) / 60).toPrecision(2);
  }

  if (json) {
    console.log(history);
  } else {
    cli.pager(
      cli.table({
        columns: [
          "Build",
          "Date",
          "Duration",
          "Result",
          `Build Time (Threshold: ${threshold} mins)`,
          "Trigger"
        ],
        rows: history.map(item => {
          return [
            formatters.id(item.id),
            formatters.date(item.createdOn),
            formatters.duration(item.duration),
            formatters.result(item.result),
            formatters.bar(item.duration, min, max, threshold),
            formatters.ref(item.refType, item.refName)
          ];
        })
      })
    );
  }

  return history;
}
