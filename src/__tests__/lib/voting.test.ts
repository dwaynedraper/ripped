import { describe, it, expect } from "vitest";
import { computeVotingPower } from "@/lib/voting";

describe("computeVotingPower", () => {
  it("returns 1 for 0 points", () => {
    expect(computeVotingPower(0)).toBe(1);
  });
  it("returns 1 for 9 points", () => {
    expect(computeVotingPower(9)).toBe(1);
  });
  it("returns 2 for 10 points", () => {
    expect(computeVotingPower(10)).toBe(2);
  });
  it("returns 2 for 29 points", () => {
    expect(computeVotingPower(29)).toBe(2);
  });
  it("returns 3 for 30 points", () => {
    expect(computeVotingPower(30)).toBe(3);
  });
  it("returns 3 for 59 points", () => {
    expect(computeVotingPower(59)).toBe(3);
  });
  it("returns 4 for 60 points", () => {
    expect(computeVotingPower(60)).toBe(4);
  });
  it("returns 4 for 99 points", () => {
    expect(computeVotingPower(99)).toBe(4);
  });
  it("returns 5 for 100 points", () => {
    expect(computeVotingPower(100)).toBe(5);
  });
  it("returns 5 for 999 points", () => {
    expect(computeVotingPower(999)).toBe(5);
  });
});
