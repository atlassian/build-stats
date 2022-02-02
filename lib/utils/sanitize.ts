import inquirer from "inquirer";

const getHost = {
	name: 'host',
	type: 'list',
	message: 'Select the CI host:',
	choices: [{
		name: 'Bamboo',
		value: 'bamboo'
	}, {
		name: 'Bitbucket pipelines',
		value: 'bitbucket'
	}, {
		name: 'Travis CI',
		value: 'travis'
	}]
};

const getUser = {
	name: 'user',
	type: 'input',
	message: 'Enter the username of the repo owner'
};

const getRepo = {
	name: 'repo',
	type: 'input',
	message: 'Enter the repo name'
}

export async function sanitizeInput(input): Promise<[Array<string>, string]> {
	if ((/(.*):(.*)\/(.*)/).test(input[0])) {
		return [
			input[0].match(/(.*):(.*)\/(.*)/).slice(1),
			input[1]
		]
	}

	const { host, user, repo } = await inquirer.prompt([
		getHost,
		getUser,
		getRepo
	]);

	return [[host, user, repo], input[0]];
}

