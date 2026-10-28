import { describe, expect, it } from "vitest";

import { dayRange, lastDays, monthsOfYear, summarize } from "../src/stats";

describe("statistics ranges", () => {
  it("a day runs from local midnight to the next midnight", () => {
    const { start, end } = dayRange(new Date(2024, 2, 15, 13, 45));
    expect(start).toEqual(new Date(2024, 2, 15));
    expect(end).toEqual(new Date(2024, 2, 16));
  });

  it("last 7 days end today, oldest first, crossing month boundaries", () => {
    const days = lastDays(new Date(2024, 2, 3, 10), 7);
    expect(days).toHaveLength(7);
    expect(days[0].start).toEqual(new Date(2024, 1, 26));
    expect(days[6].start).toEqual(new Date(2024, 2, 3));
  });

  it("months do not overlap (the original version counted the last day of each month twice)", () => {
    const months = monthsOfYear(new Date(2024, 6, 1));
    expect(months).toHaveLength(12);
    expect(months[0].start).toEqual(new Date(2024, 0, 1));
    expect(months[1].start).toEqual(new Date(2024, 1, 1));
    for (let m = 0; m < 11; m++) expect(months[m].end).toEqual(months[m + 1].start);
    expect(months[11].end).toEqual(new Date(2025, 0, 1));
  });

  it("summarizes rides", () => {
    expect(summarize([{ distance: 3.5, estimated_price: 420 }, { distance: 1, estimated_price: 220 }])).toEqual({
      numOfRides: 2,
      totalKms: 4.5,
      totalPrice: 640,
    });
    expect(summarize([])).toEqual({ numOfRides: 0, totalKms: 0, totalPrice: 0 });
  });
});
