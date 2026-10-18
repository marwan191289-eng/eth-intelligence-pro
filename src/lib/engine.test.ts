import { describe, it, expect } from "vitest";
import { positionSize } from "./engine";

describe("1% risk rule", () => {
  it("risks exactly 1% of equity at the stop", () => {
    const p = positionSize(10000, 1, 2400, 2380);
    expect(p.riskAmount).toBe(100);
    expect(p.qty).toBeCloseTo(5);
  });
});
