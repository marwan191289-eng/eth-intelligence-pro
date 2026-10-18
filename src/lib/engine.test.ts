import { describe, it, expect } from "vitest";
import { backtest, computeSignal, evaluateNextCandle, positionSize, type Candle } from "./engine";

describe("1% risk rule", () => {
  it("risks exactly 1% of equity at the stop", () => {
    const p = positionSize(10000, 1, 2400, 2380);
    expect(p.riskAmount).toBe(100);
    expect(p.qty).toBeCloseTo(5);
  });
});

const bar = (open: number, high: number, low: number, close: number): Candle => ({ time: 0, open, high, low, close, volume: 100 });
describe("five-minute execution", () => {
  it("counts a long stop before a target when both are touched", () => {
    const result = evaluateNextCandle("LONG", 100, 97, 104, bar(100, 106, 96, 105));
    expect(result.r).toBe(-1);
    expect(result.exit).toBe(97);
  });
  it("counts a short stop before a target when both are touched", () => {
    expect(evaluateNextCandle("SHORT", 100, 103, 96, bar(100, 104, 95, 96)).r).toBe(-1);
  });
  it("uses the five-minute close if neither exit was touched", () => {
    expect(evaluateNextCandle("LONG", 100, 97, 104, bar(100, 102, 99, 101.5)).r).toBe(0.5);
  });
  it("exits at the target price rather than the candle close", () => {
    expect(evaluateNextCandle("LONG", 100, 97, 104, bar(100, 110, 99, 108)).r).toBeCloseTo(4 / 3);
  });
  it("does not use future candles in a historical signal", () => {
    const candles = Array.from({ length: 60 }, (_, i) => ({ ...bar(100 + i, 102 + i, 99 + i, 101 + i), time: i * 300 }));
    expect(computeSignal([...candles, bar(1000, 2000, 900, 1900)], 59)).toEqual(computeSignal(candles));
  });
  it("does not generate trades in a zero-volatility market", () => {
    expect(backtest(Array.from({ length: 60 }, () => bar(100, 100, 100, 100))).trades).toBe(0);
  });
  it("rejects insufficient signal history", () => {
    expect(() => computeSignal([bar(100, 101, 99, 100)])).toThrow(RangeError);
  });
  it("prevents positions with invalid capital", () => {
    expect(positionSize(-10000, 1, 2400, 2380).qty).toBe(0);
    expect(positionSize(NaN, 1, 2400, 2380).qty).toBe(0);
  });
});
