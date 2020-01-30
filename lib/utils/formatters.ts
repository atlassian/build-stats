import leftPad from "left-pad";
import chalk from "chalk";
import format from "date-fns/format";
import { GRAPH_MAX_LENGTH } from "../constants";

export function id(num) {
  return `#${num}`;
}

export function duration(dur) {
  return `${leftPad((dur / 60).toFixed(2), 8, "")} min`;
}

export function bar(value, min, max, threshold) {
  const thresholdInSeconds = threshold * 60;
  let distance = max - min;
  // edge-case if there is only one build, => min === max
  distance = Math.max(1, distance);
  let unit = GRAPH_MAX_LENGTH / distance;
  let length = Math.ceil((value - min) * unit);
  let bar = "█" + new Array(length).join("█") + new Array(15).join(" ");

  if (value > thresholdInSeconds) {
    return chalk.red(bar);
  }
  return chalk.green(bar);
}

export function singleBar(greenValue, redValue) {
  let bar = "";
  let distance = greenValue + redValue;
  let greenLength = Math.ceil(
    (GRAPH_MAX_LENGTH / distance) * greenValue
  );
  let redLength = Math.ceil((GRAPH_MAX_LENGTH / distance) * redValue);

  if (greenLength + redLength > GRAPH_MAX_LENGTH) {
    greenLength > redLength ? --greenLength : --redLength;
  }

  if (redLength > redValue) {
    redLength = redValue;
  }

  if (greenLength > greenValue) {
    greenLength = greenValue;
  }

  bar += chalk.red(new Array(redLength + 1).join("█"));
  bar += chalk.green(new Array(greenLength + 1).join("█"));

  return bar + new Array(15).join(" ");
}

export function result(res) {
  if (res === "SUCCESSFUL") return chalk.green(res);
  if (res === "FAILED") return chalk.red(res);
  return chalk.yellow(res);
}

export function date(dateStr) {
  return format(new Date(dateStr), "ddd, DD/MM/YYYY HH:mm:ss");
}

export function dateRange(start, end) {
  return format(start, "DD/MM/YYYY") + "-" + format(end, "DD/MM/YYYY");
}

export function ref(refType, refName) {
  return `${refType} = ${refName}`;
}
