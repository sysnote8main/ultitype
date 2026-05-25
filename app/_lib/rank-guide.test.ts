import { describe, expect, test } from "bun:test";
import { getRankProgression } from "@/src/lib/typing";
import { getRankGuideStatusLabel, splitRankGuideColumns } from "./rank-guide";

describe("rank guide helpers", () => {
  test("splits G0 through S6 and M0 onward into separate columns", () => {
    const columns = splitRankGuideColumns(getRankProgression());

    expect(columns.standard[0]?.label).toBe("G0");
    expect(columns.standard.at(-1)?.label).toBe("S6");
    expect(columns.master[0]?.label).toBe("M0");
    expect(columns.master.at(-1)?.label).toBe("UM0");
  });

  test("shows achievement or the remaining score in the status column", () => {
    expect(getRankGuideStatusLabel(500, 500)).toBe("達成");
    expect(getRankGuideStatusLabel(590, 500)).toBe("あと 90");
    expect(getRankGuideStatusLabel(1000.4, 900)).toBe("あと 101");
  });
});
