import { default as cache } from "./lib/commands/cache";
import { default as calculate } from "./lib/commands/calculate";
import { default as clean } from "./lib/commands/clean";
import { default as download } from "./lib/commands/download";
import { default as history } from "./lib/commands/history";
import { default as success } from "./lib/commands/success";
import { flagsEnum, MainTypes } from "./types";
import pick from "lodash.pick";

export default async function main({
  command,
  repoSlug,
  flags,
  cwd,
}: MainTypes) {
  let [, host, user, repo]: string[] = repoSlug;

  switch (command) {
    case "download":
      await download({
        cwd,
        host,
        user,
        repo,
        ...pick(flags, [
          flagsEnum.auth,
          flagsEnum.concurrency,
          flagsEnum.since,
        ]),
      });
      break;
    case "calculate":
      await calculate({
        cwd,
        host,
        user,
        repo,
        ...pick(flags, [
          flagsEnum.branch,
          flagsEnum.result,
          flagsEnum.period,
          flagsEnum.last,
          flagsEnum.threshold,
          flagsEnum.json,
        ]),
      });
      break;
    case "history":
      await history({
        cwd,
        host,
        user,
        repo,
        ...pick(flags, [
          flagsEnum.branch,
          flagsEnum.result,
          flagsEnum.threshold,
          flagsEnum.json,
        ]),
      });
      break;
    case "success":
      await success({
        cwd,
        host,
        user,
        repo,
        ...pick(flags, [
          flagsEnum.branch,
          flagsEnum.result,
          flagsEnum.period,
          flagsEnum.last,
          flagsEnum.json,
        ]),
      });
      break;
    case "clean":
      await clean({
        cwd,
        host,
        user,
        repo,
      });
      break;
    case "cache":
      await cache({ cwd, host, user, repo });
      break;
    default:
      throw new Error(
        `Unknown command "${command}", should be "download", "calculate", "history", "success", "clean", "cache"`
      );
  }
}
