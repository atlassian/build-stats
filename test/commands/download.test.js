'use strict';
const test = require('ava');
const download = require('../../lib/commands/download');
const sinon = require('sinon');
const fixtures = require('fixturez');
const adapters = require('../../lib/adapters');
const f = fixtures(__dirname);

test.skip('it calls bitbucket download with appropiate path', async t => {
  let stub = sinon.stub(adapters, 'bitbucket');
  let cwd = f.find('testRepo');
  await download({ cwd, host: 'bitbucket', user: 'test', repo: 'test-repo' });
  t.is(stub.callCount, 1);
});
