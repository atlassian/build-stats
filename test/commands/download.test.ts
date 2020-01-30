import test from 'ava';
import download from '../../lib/commands/download';
import sinon from 'sinon';
import fixtures from 'fixturez';
import adapters from '../../lib/adapters';
const f = fixtures(__dirname);

test.skip('it calls bitbucket download with appropiate path', async t => {
  let stub = sinon.stub(adapters, 'bitbucket');
  let cwd = f.find('testRepo');
  await download({ cwd, host: 'bitbucket', user: 'test', repo: 'test-repo' });
  t.is(stub.callCount, 1);
});
