import chalk from "chalk";

export class InvalidInputError extends Error{
	constructor(message, private input) {
		super(message);
	}

	getMessage() {
		return chalk.red`build-stats ${this.input.join(" ")} `+`is not a valid input. \nRun `+ chalk.yellow`build-stats --help`+` to see the usage.`
	}
}
