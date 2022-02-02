#!/usr/bin/env node
import meow from "meow";
import main from "./index";
import Text from "./lib/text";
import {FlagTypes} from "./types";
import {InvalidInputError} from "./lib/error";
import {sanitizeInput} from './lib/utils/sanitize';

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

	try {
		if (cli.input.length < 1) {
			cli.showHelp();
		}

		const [repoSlug, command] = await sanitizeInput(cli.input);

		await main({
			cwd: __dirname,
			repoSlug,
			command,
			flags: cli.flags as FlagTypes,
		});
	} catch (err) {
		if (err instanceof InvalidInputError) {
			console.error(err.getMessage());
		} else {
			throw err;
		}
	}
}

cli(process.argv.slice(2)).catch((err) => {
	console.error(err);
	process.exit(1);
});
