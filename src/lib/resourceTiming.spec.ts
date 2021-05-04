import { removeEntryProps, normalizeEntry } from "./resourceTiming";
import { ResourceTimingEntry } from "@openinsights/openinsights";
import entriesFixture from "../fixtures/entries";

describe("Resource timing", (): void => {
  describe("#removeEntryProps", (): void => {
    it("should return a new object", (): void => {
      const [fixture] = (entriesFixture as any) as ResourceTimingEntry[];
      expect(removeEntryProps(fixture, [])).not.toBe(fixture);
    });

    it("should return an without the given properties", (): void => {
      const [fixture] = (entriesFixture as any) as ResourceTimingEntry[];
      const result = removeEntryProps(fixture, ["name"]);
      expect(result).not.toHaveProperty("name");
    });
  });

  describe("#mormalizeEntry", (): void => {
    it("should remove exteraneous keys", (): void => {
      const [fixture] = (entriesFixture as any) as ResourceTimingEntry[];
      const result = normalizeEntry(fixture);
      expect(result).not.toHaveProperty("name");
      expect(result).not.toHaveProperty("entryType");
      expect(result).not.toHaveProperty("toJSON");
      expect(result).not.toHaveProperty("entry_type");
    });

    it("should normalize entry keys to underscore case", (): void => {
      const [fixture] = (entriesFixture as any) as ResourceTimingEntry[];
      const result = normalizeEntry(fixture);
      expect(result).not.toHaveProperty("workerStart");
      expect(result).toHaveProperty("worker_start");
    });
  });
});
