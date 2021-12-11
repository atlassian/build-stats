#!/usr/bin/env node
import meow from "meow";
import main from "./index";
import Text from "./lib/text";

async function cli(argv: string[]) {
  const cli = meow({
    argv,
    help: Text.mainText.help,
    flags: {
      auth: {
        type: "string",
      },
      branch: {
        type: "string",
      },
      concurrency: {
        type: "number",
        default: 10,
      },
      json: {
        type: "boolean",
      },
      last: {
        type: "number",
      },
      period: {
        type: "number",
      },
      since: {
        type: "number",
      },
    },
  });

  if (cli.input.length < 2) {
    cli.showHelp();
  }

  const repoSlug = cli.input[0].match(/(.*):(.*)\/(.*)/);

  if (!repoSlug) {
    throw new Error(
      `Invalid repo "${cli.input[0]}", should be "host:user/repo"`
    );
  }

  await main({
    cwd: __dirname,
    repoSlug,
    command: cli.input[1],
    flags: cli.flags,
  });
}

cli(process.argv.slice(2)).catch((err) => {
  console.error(err);
  process.exit(1);
});
