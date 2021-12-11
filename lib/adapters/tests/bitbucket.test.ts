import got from "got";
import fetchBitbucketPipeline, { getTotalBuilds } from "../bitbucket";

jest.mock("got");

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
});
