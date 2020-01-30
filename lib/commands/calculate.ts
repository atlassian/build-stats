import groupBy from "lodash.groupby";
import * as cli from "../utils/cli";
import * as math from "../utils/math";
import * as formatters from "../utils/formatters";
import * as builds from "../utils/builds";

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
    longestBuild
  };
}

function calculateRanges(ranges) {
  return ranges.map(range => {
    let result: {[key: string]: any} = {};
    let groups = groupBy(range, build => build.result);

    result.ALL = calculateGroup(range);
    for (let groupName of Object.keys(groups)) {
      result[groupName] = calculateGroup(groups[groupName]);
    }

    return result;
  });
}

export default async function calculate({
  cwd,
  host,
  user,
  repo,
  branch = "*",
  result = "*",
  period = 1,
  last = 30,
  threshold,
  json = false
}) {
  let history = await builds.getHistory(cwd, host, user, repo, {
    branch,
    result
  });
  let ranges = builds.toTimeRanges(history, { period, last });
  let results = calculateRanges(ranges);

  let successfulRanges = results.filter(range => !!range.SUCCESSFUL);
  let buildPercentileMean = successfulRanges.map(
    range => range.SUCCESSFUL.buildPercentileMean
  );
  let { min, max } = math.getMinMax(buildPercentileMean);
  if (threshold == undefined) {
    threshold = (math.getMean([min, max]) / 60).toPrecision(2);
  }

  if (json) {
    console.log(results);
  } else {
    console.log(
      cli.table({
        columns: [
          "",
          "Date Range (DD/MM/YYY)",
          "Total Builds",
          "Mean",
          "Mean (95%)",
          "Longest",
          `Build Time ( threshold: ${threshold} mins )`
        ],
        rows: successfulRanges.map((range, index) => {
          return [
            index + 1,
            formatters.dateRange(range.SUCCESSFUL.start, range.SUCCESSFUL.end),
            range.SUCCESSFUL.totalBuilds,
            formatters.duration(range.SUCCESSFUL.buildDurationMean),
            formatters.duration(range.SUCCESSFUL.buildPercentileMean),
            `${formatters.duration(
              range.SUCCESSFUL.longestBuild.duration
            )} (${formatters.id(range.SUCCESSFUL.longestBuild.id)})`,
            formatters.bar(
              range.SUCCESSFUL.buildPercentileMean,
              min,
              max,
              threshold
            )
          ];
        })
      })
    );
  }

  return results;
}
