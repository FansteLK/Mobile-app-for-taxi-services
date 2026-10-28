// Load tariffs, settings and demo accounts. Safe to re-run: existing collections are replaced.
//   npm run seed      (uses MONGODB_URI)
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { config } from "./config";
import { Ride, Tariff, User, Value } from "./models";

export const DEMO_PASSWORD = "Demo1234";

export async function seed() {
  await Promise.all([Tariff.deleteMany({}), Value.deleteMany({}), User.deleteMany({}), Ride.deleteMany({})]);

  // Prices in RSD, from the original project data. Holiday detection is not implemented,
  // so the holiday tariff is never selected.
  const tariffs = [
    { name: "day", starting_price: 220, price_per_km: 80, night: false, weekend: false, holiday: false },
    { name: "night", starting_price: 220, price_per_km: 100, night: true, weekend: false, holiday: false },
    { name: "weekend", starting_price: 220, price_per_km: 120, night: false, weekend: true, holiday: false },
    { name: "weekend night", starting_price: 220, price_per_km: 140, night: true, weekend: true, holiday: false },
    { name: "holiday", starting_price: 220, price_per_km: 140, night: false, weekend: false, holiday: true },
  ];
  await Tariff.insertMany(tariffs);

  await Value.insertMany([
    { name: "request_waiting_duration", value: 30 }, // seconds a passenger waits for a driver
    { name: "max_distance", value: 20 }, // km radius in which drivers receive requests
    { name: "location_refresh_time", value: 5 }, // seconds between driver location updates
  ]);

  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  await User.insertMany([
    { email: "passenger@example.com", password, number: "0601111111", type: "user", regular: true },
    {
      email: "driver@example.com",
      password,
      number: "0602222222",
      type: "driver",
      availability: "available",
      regular: true,
      licence_plate: "BG-123-AB",
    },
  ]);
}

if (require.main === module) {
  mongoose
    .connect(config.mongoUri)
    .then(seed)
    .then(() => console.log(`Seeded. Demo accounts use the password ${DEMO_PASSWORD}`))
    .finally(() => mongoose.disconnect());
}
