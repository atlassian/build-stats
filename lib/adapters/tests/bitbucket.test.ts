import fs from "fs";
import got from "got";
import path from "path";
import fixturez from "fixturez";
import { promisify } from "util";
import fetchBitbucketPipeline, { getTotalBuilds } from "../bitbucket";

const readFile = promisify(fs.readFile);
const BITBUCKET_API = "https://api.bitbucket.org/2.0/repositories";

jest.mock("got");
const f = fixturez(__dirname);

describe("bitbucket", () => {
  describe("getTotalBuild", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
    it("should retuns the size from pipeline API", async () => {
      got.mockResolvedValue({ body: JSON.stringify({ size: 5 }) });
      const r = await getTotalBuilds("test-user", "test-repo", {
        auth: undefined,
      });
      expect(r).toBe(5);
    });

    it("should throw and exit the error if API errors out", async () => {
      got.mockRejectedValue(new Error("The Authorisation failed"));
      await expect(
        getTotalBuilds("test-user", "test-repo", {
          auth: undefined,
        })
      ).rejects.toThrow("The Authorisation failed");
    });
  });

  describe("fetchBitbucketPipeline", () => {
    it("should write the build info in standard format", async () => {
      const testUser = "test-user";
      const testRepo = "test-repo";
      const tempDir = f.temp();
      got.mockImplementation(async (url) => {
        if (url === `${BITBUCKET_API}/${testUser}/${testRepo}/pipelines/`)
          return Promise.resolve({ body: JSON.stringify({ size: 1 }) });
        if (
          url ===
          `${BITBUCKET_API}/${testUser}/${testRepo}/pipelines/?pagelen=100&page=1&sort=created_on`
        ) {
          const path_to_pipelines_response = f.find(
            "bitbucket_pipeline_response.json"
          );
          const pipeline_response = await readFile(
            path_to_pipelines_response,
            "utf-8"
          );

          return {
            body: JSON.stringify(JSON.parse(pipeline_response)),
          };
        }
      });

      await fetchBitbucketPipeline(tempDir, {
        concurrency: 1,
        repo: testRepo,
        since: "4",
        user: testUser,
      });

      const pipelineData = await readFile(
        path.resolve(tempDir, "1.json"),
        "utf-8"
      );

      expect(JSON.parse(pipelineData)).toEqual({
        id: 1,
        uuid: 1,
        createdOn: "",
        duration: 17,
        result: "SUCCESSFUL",
      });
    });
  });
});
