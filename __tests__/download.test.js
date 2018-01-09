'use strict';
const test = require('ava');
const download = require('../lib/commands/download');
const sinon = require('sinon');
const { getFixturePath } = require('jest-fixtures');
const HOSTS = require('../lib/ci');

test('it calls bitbucket download with appropiate path', async (t) => {
    let stub = sinon.stub(HOSTS, 'bitbucket');
    let cwd = await getFixturePath(__dirname, 'testRepo');
    await download({cwd, host: 'bitbucket', user: 'test',repo: 'test-repo'});
    t.is(stub.callCount, 1);
});