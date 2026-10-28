export interface Range {
  start: Date;
  end: Date; // exclusive
}

export interface Summary {
  numOfRides: number;
  totalKms: number;
  totalPrice: number;
}

export function dayRange(day: Date): Range {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
  return { start, end };
}

/** The last `days` calendar days, oldest first, ending with the day of `now`. */
export function lastDays(now: Date, days: number): Range[] {
  return Array.from({ length: days }, (_, i) =>
    dayRange(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1 - i))),
  );
}

/** January to December of the year of `now`. */
export function monthsOfYear(now: Date): Range[] {
  const year = now.getFullYear();
  return Array.from({ length: 12 }, (_, m) => ({ start: new Date(year, m, 1), end: new Date(year, m + 1, 1) }));
}

export function summarize(rides: { distance?: number | null; estimated_price?: number | null }[]): Summary {
  return rides.reduce<Summary>(
    (acc, ride) => ({
      numOfRides: acc.numOfRides + 1,
      totalKms: acc.totalKms + (ride.distance ?? 0),
      totalPrice: acc.totalPrice + (ride.estimated_price ?? 0),
    }),
    { numOfRides: 0, totalKms: 0, totalPrice: 0 },
  );
}
