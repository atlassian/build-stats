import download from "../download";
import fixtures from "fixturez";
import adapters from "../../adapters";
import path from "path";
const f = fixtures(__dirname);

jest.mock('../../adapters');

test("it calls bitbucket download with appropiate path", async () => {
  adapters.bitbucket = jest.fn();
  let cwd = f.find("testRepo");
  await download({ cwd, host: "bitbucket", user: "test", repo: "test-repo" });
  expect(adapters.bitbucket).toHaveBeenCalledTimes(1);
  expect(adapters.bitbucket).toHaveBeenCalledWith(path.join(cwd, ".data", "bitbucket", "test", "test-repo", "builds"), expect.anything())
});
