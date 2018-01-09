'use strict';
const test = require('ava');
const sinon = require('sinon');
const { getFixturePath } = require('jest-fixtures');
const utils = require('../lib/commands/util');

test('it should return constucted build path', async (t) => {
    let cwd = await getFixturePath(__dirname, 'testRepo');
    const constructedPath = await utils.getBuildDir(cwd, 'bitbucket', 'test', 'test-repo');
    t.regex(constructedPath, /testRepo\/\.data\/bitbucket\/test\/test-repo\/builds/);
});
