import inquirer from 'inquirer';
import { SUPPORTED_COMMANDS } from '../../index';
import { InvalidInputError } from '../error';
import { getAllDownloadedSlugs } from './builds';
import flatten from 'lodash.flatten';

const getHost = {
  name: 'host',
  type: 'list',
  message: 'Select the CI host:',
  choices: [
    {
      name: 'Bamboo',
      value: 'bamboo',
    },
    {
      name: 'Bitbucket pipelines',
      value: 'bitbucket',
    },
    {
      name: 'Travis CI',
      value: 'travis',
    },
  ],
};

const getUser = {
  name: 'user',
  type: 'input',
  message: 'Enter the username of the repo owner',
};

const getRepo = {
  name: 'repo',
  type: 'input',
  message: 'Enter the repository name',
};

const getSlug = (choices) => ({
  name: 'slug',
  type: 'list',
  message: 'Select the repo:',
  choices
})

export async function sanitizeInput(input): Promise<[Array<string>, string]> {
  if (/(.*):(.*)\/(.*)/.test(input[0])) {
    return [input[0].match(/(.*):(.*)\/(.*)/).slice(1), input[1]];
  }

  if (input[0] === 'download') {
    const { host, user, repo } = await inquirer.prompt([getHost, getUser, getRepo]);

    return [[host, user, repo], input[0]];
  }

  if (SUPPORTED_COMMANDS.indexOf(input[0]) !== -1) {
    const downloadedSlugs = await getAllDownloadedSlugs();
    const { slug } = await inquirer.prompt([getSlug(downloadedSlugs)]);

  if (/(.*):(.*)\/(.*)/.test(slug)) {
    return [slug.match(/(.*):(.*)\/(.*)/).slice(1), input[0]];
  }
  }
  
  throw new InvalidInputError(`Invalid input. Please run build-stats --help to documention for the tool.`, input);
}
