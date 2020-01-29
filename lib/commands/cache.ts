import { getBuildDir } from "../utils/builds";

export default async function cache({ cwd, host, user, repo }) {
  const cacheDir = await getBuildDir(cwd, host, user, repo);
  console.log(cacheDir);
  // returning since these commands are also exposed from the index.js file
  return cacheDir;
}
