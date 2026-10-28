export interface TariffRates {
  starting_price: number;
  price_per_km: number;
}

export interface PriceRequest {
  distanceKm: number;
  // Google Maps durations, in seconds
  duration: number;
  durationInTraffic: number;
}

/** Night tariff applies from 22:00 to 06:59 local time. */
export function isNight(date: Date): boolean {
  const hour = date.getHours();
  return hour >= 22 || hour < 7;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Congestion surcharge: half of the relative delay caused by traffic.
 * A trip that takes twice as long in traffic costs 1.5x per kilometre.
 */
export function trafficCoefficient(duration: number, durationInTraffic: number): number {
  if (!(duration > 0) || !(durationInTraffic > duration)) return 1;
  return (durationInTraffic / duration - 1) / 2 + 1;
}

/** The starting price covers the first kilometre; every further kilometre is charged with the traffic surcharge. */
export function estimatePrice(tariff: TariffRates, request: PriceRequest): number {
  const extraKm = Math.max(0, request.distanceKm - 1);
  const coefficient = trafficCoefficient(request.duration, request.durationInTraffic);
  const price = tariff.starting_price + tariff.price_per_km * extraKm * coefficient;
  return Math.round(price * 100) / 100;
}
