import { describe, expect, test } from "bun:test";
import {
  createShuffledIndexes,
  formatChallengeReading,
  getOrderedChallengeIndex,
} from "./challenge-utils";

describe("practice challenge order", () => {
  test("shuffles indexes using the provided random source", () => {
    const randomValues = [0.99, 0, 0.5, 0.1];
    const order = createShuffledIndexes(5, () => randomValues.shift() ?? 0);

    expect(order).toEqual([2, 3, 1, 0, 4]);
  });

  test("keeps the first shuffled index different from the previous cycle's last index", () => {
    const randomValues = [0, 0];
    const order = createShuffledIndexes(3, () => randomValues.shift() ?? 0, 1);

    expect(order).toEqual([2, 1, 0]);
  });

  test("allows a single available challenge to repeat", () => {
    expect(createShuffledIndexes(1, () => 0, 0)).toEqual([0]);
  });

  test("resolves shuffled challenge indexes with wraparound", () => {
    const order = [2, 0, 1];

    expect(getOrderedChallengeIndex(0, 3, order)).toBe(2);
    expect(getOrderedChallengeIndex(4, 3, order)).toBe(0);
  });
});

describe("challenge reading display", () => {
  test("keeps hiragana word spaces when guide spaces are enabled", () => {
    expect(formatChallengeReading("こうそくな たいぴんぐ では", true)).toBe(
      "こうそくな たいぴんぐ では",
    );
  });

  test("removes hiragana word spaces when guide spaces are disabled", () => {
    expect(formatChallengeReading("こうそくな たいぴんぐ では", false)).toBe(
      "こうそくなたいぴんぐでは",
    );
  });
});
