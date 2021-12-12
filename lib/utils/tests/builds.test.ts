import fixtures from "fixturez";
import * as builds from "../builds";
const f = fixtures(__dirname);

test("builds.getBuildDir()", async () => {
  let cwd = f.copy("testRepo");
  let dirPath = await builds.getBuildDir(cwd, "bitbucket", "test", "test-repo");
  expect(dirPath).toMatch(/testRepo\/\.data\/bitbucket\/test\/test-repo\/builds/)
});

test.todo("builds.getHistory()");
test.todo("builds.findLongest()");
test.todo("builds.toTimeRanges()");
