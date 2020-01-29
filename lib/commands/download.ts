import builds from '../utils/builds';
import adapters from '../adapters/index';

interface DownloadArgs {
  cwd: string;
  host: string;
  user: string;
  repo: string;
  auth: string;
  concurrency: number;
  since: number
}

export default async function download(
  { cwd, host, user, repo, auth, concurrency, since }: DownloadArgs,
  downloadHook?: Function
) {
  let buildsDir = await builds.getBuildDir(cwd, host, user, repo);
  let adapter = adapters[host];

  if (adapter) {
    await adapter(buildsDir, {
      auth,
      concurrency,
      downloadHook,
      repo,
      since,
      user
    });
  } else {
    throw new Error(`Unknown CI service: ${host}`);
  }
}
