'use strict';
const test = require('ava');
const fixtures = require('fixturez');
const builds = require('../../lib/utils/builds');
const f = fixtures(__dirname);

test('builds.getBuildDir()', async t => {
  let cwd = f.copy('testRepo');
  let dirPath = await builds.getBuildDir(cwd, 'bitbucket', 'test', 'test-repo');
  t.regex(dirPath, /testRepo\/\.data\/bitbucket\/test\/test-repo\/builds/);
});

test.todo('builds.getHistory()');
test.todo('builds.findLongest()');
test.todo('builds.toTimeRanges()');
