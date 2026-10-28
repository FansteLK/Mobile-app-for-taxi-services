import { Schema, model } from "mongoose";

const userSchema = new Schema({
  email: String,
  password: String,
  // "user" (passenger) or "driver"
  type: String,
  number: String,
  // drivers only: "available" | "unavailable"
  availability: String,
  // false once a driver reports the passenger as a no-show; irregular users cannot order rides
  regular: Boolean,
  licence_plate: String,
});
userSchema.set("toJSON", {
  transform: (_doc, ret: Record<string, unknown>) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

export type RideStatus = "" | "scheduled" | "accepted" | "finished" | "canceled";

const rideSchema = new Schema({
  user_email: String,
  driver: String,
  origin: String,
  destination: String,
  estimated_price: Number,
  estimated_duration: Number,
  distance: Number,
  // "" = price quoted, waiting for the passenger to confirm
  status: String,
  user_waiting_time: Number,
  user_token: String,
  taxiOrigin: String,
  date: Date,
});

const tariffSchema = new Schema({
  name: String,
  starting_price: Number,
  price_per_km: Number,
  night: Boolean,
  weekend: Boolean,
  holiday: Boolean,
});

// Runtime settings editable in the database (request_waiting_duration, max_distance, location_refresh_time).
const valueSchema = new Schema({
  name: String,
  value: Number,
});

export const User = model("User", userSchema, "users");
export const Ride = model("Ride", rideSchema, "rides");
export const Tariff = model("Tariff", tariffSchema, "tariffs");
export const Value = model("Value", valueSchema, "values");
