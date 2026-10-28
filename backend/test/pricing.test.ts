import { describe, expect, it } from "vitest";

import { estimatePrice, isNight, isWeekend, trafficCoefficient } from "../src/pricing";

const DAY = { starting_price: 220, price_per_km: 80 };

describe("tariff selection", () => {
  it("night runs from 22:00 to 06:59", () => {
    expect(isNight(new Date(2024, 5, 3, 21, 59))).toBe(false);
    expect(isNight(new Date(2024, 5, 3, 22, 0))).toBe(true);
    expect(isNight(new Date(2024, 5, 4, 6, 59))).toBe(true);
    expect(isNight(new Date(2024, 5, 4, 7, 0))).toBe(false);
  });

  it("weekend is Saturday and Sunday", () => {
    expect(isWeekend(new Date(2024, 5, 7))).toBe(false); // Friday
    expect(isWeekend(new Date(2024, 5, 8))).toBe(true); // Saturday
    expect(isWeekend(new Date(2024, 5, 9))).toBe(true); // Sunday
    expect(isWeekend(new Date(2024, 5, 10))).toBe(false); // Monday
  });
});

describe("price estimate", () => {
  it("charges the starting price plus every kilometre after the first", () => {
    expect(estimatePrice(DAY, { distanceKm: 6, duration: 600, durationInTraffic: 600 })).toBe(620);
  });

  it("never goes below the starting price for very short rides", () => {
    expect(estimatePrice(DAY, { distanceKm: 0.4, duration: 60, durationInTraffic: 60 })).toBe(220);
  });

  it("adds half of the relative traffic delay to the per-km price", () => {
    expect(trafficCoefficient(600, 1200)).toBe(1.5);
    expect(trafficCoefficient(600, 300)).toBe(1); // faster than usual: no discount
    expect(trafficCoefficient(0, 300)).toBe(1); // missing data
    expect(estimatePrice(DAY, { distanceKm: 6, duration: 600, durationInTraffic: 1200 })).toBe(820);
  });

  it("rounds to two decimals", () => {
    expect(estimatePrice(DAY, { distanceKm: 2.3456, duration: 1, durationInTraffic: 1 })).toBe(327.65);
  });
});
