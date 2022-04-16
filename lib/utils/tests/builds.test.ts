import fixtures from 'fixturez';
import * as builds from '../builds';
const f = fixtures(__dirname);

test('builds.getAllDownloadsSlugs', async () => {
  const cwd = f.copy('with-builds');
  const downloadedSlugs = await builds.getAllDownloadedSlugs(cwd);
  expect(downloadedSlugs.length).toBe(2);
  expect(downloadedSlugs).toEqual(expect.arrayContaining([
    'bitbucket:atlassian/build-stats',
    'travis:boltpkg/bolt'
  ]));
});

test('builds.getBuildDir()', async () => {
  let cwd = f.copy('testRepo');
  let dirPath = await builds.getBuildDir(cwd, 'bitbucket', 'test', 'test-repo');
  expect(dirPath).toMatch(/testRepo\/\.data\/bitbucket\/test\/test-repo\/builds/);
});

test('builds.getHistory()',async () => {
  const cwd = f.copy('with-builds');
  const history = await builds.getHistory(cwd, 'bitbucket', 'atlassian', 'build-stats', {
    branch: '*',
    result: '*'
  });
  expect(history.length).toBe(10);
});
test('builds.findLongest()',async () => {
  const cwd = f.copy('with-builds');
  const allBuilds = await builds.getHistory(cwd, 'bitbucket', 'atlassian', 'build-stats', {
    branch: '*',
    result: '*'
  });

  const longestBuild = builds.findLongest(allBuilds);
  expect(longestBuild.id).toBe('7')
});

test('builds.toTimeRanges()',async () => {
  const cwd = f.copy('with-builds');
  const allBuilds = await builds.getHistory(cwd, 'bitbucket', 'atlassian', 'build-stats', {
    branch: '*',
    result: '*'
  });

  const ranges = builds.toTimeRanges(allBuilds, {
    period: 365, // period of 365 days/ 1 year
    last: 100 // last 100 years
  });

  // One of the fixtures build is from 1900, so it should be excluded
  expect(ranges[0].length).toBe(9);
});
