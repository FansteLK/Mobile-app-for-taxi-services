import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../src/app";
import { Ride, User } from "../src/models";
import { DEMO_PASSWORD, seed } from "../src/seed";

let mongo: MongoMemoryServer;
const app = createApp();
const PASSENGER = "passenger@example.com";
const DRIVER = "driver@example.com";

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});
beforeEach(async () => {
  await seed();
  vi.spyOn(console, "log").mockImplementation(() => {}); // silence notification logging
});

function quote(email = PASSENGER) {
  return request(app).get("/users/requestPrice").query({
    user_email: email,
    origin: "Bulevar kralja Aleksandra 73, Beograd",
    destination: "Knez Mihailova 1, Beograd",
    distance: 4200,
    duration: 600,
    traffic_duration: 900,
  });
}

describe("accounts", () => {
  it("registers and logs in without exposing the password hash", async () => {
    const res = await request(app).post("/users/register").send({ email: "new@example.com", password: "Secret1", number: "0603333333" });
    expect(res.body).toEqual({ message: "user added" });

    const login = await request(app).post("/users/login").send({ email: "new@example.com", password: "Secret1" });
    expect(login.status).toBe(200);
    expect(login.body.email).toBe("new@example.com");
    expect(login.body.password).toBeUndefined();
  });

  it("rejects duplicate email and phone number", async () => {
    const dupEmail = await request(app).post("/users/register").send({ email: PASSENGER, password: "x", number: "1" });
    expect(dupEmail.body.message).toMatch(/email is already linked/);
    const dupNumber = await request(app).post("/users/register").send({ email: "a@b.c", password: "x", number: "0601111111" });
    expect(dupNumber.body.message).toMatch(/number is already linked/);
  });

  it("rejects wrong passwords, unknown users and irregular users", async () => {
    expect((await request(app).post("/users/login").send({ email: PASSENGER, password: "nope" })).status).toBe(400);
    expect((await request(app).post("/users/login").send({ email: "ghost@example.com", password: "x" })).status).toBe(401);
    await request(app).post("/drivers/setUserIrregular").query({ email: PASSENGER });
    const res = await request(app).post("/users/login").send({ email: PASSENGER, password: DEMO_PASSWORD });
    expect(res.body).toEqual({ error: "User isnt regular" });
  });
});

describe("ride lifecycle", () => {
  it("quotes, confirms, is accepted by a driver and finishes", async () => {
    const price = await quote();
    expect(price.status).toBe(200);
    expect(Number(price.body.price)).toBeGreaterThan(220);

    // Before the fix, confirming looked up the ride by 'user-email' and never found it.
    const confirm = await request(app).get("/users/userRideResponse").query({ response: "true", email: PASSENGER, token: "fcm-passenger" });
    expect(confirm.body).toEqual({ message: "uspesno" });
    expect((await request(app).get("/users/getActiveRide").query({ email: PASSENGER })).body).toEqual({ status: "scheduled" });

    expect((await request(app).get("/drivers/inRange").query({ user: PASSENGER, token: "fcm-driver", duration: 300 })).status).toBe(200);

    const accept = await request(app).post("/drivers/acceptRide").query({ user: PASSENGER, driver: DRIVER, duration: 300, taxiOrigin: "Slavija" });
    expect(accept.body).toEqual({ message: "uspesno" });
    // A second driver is too late.
    const late = await request(app).post("/drivers/acceptRide").query({ user: PASSENGER, driver: "other@example.com", duration: 100 });
    expect(late.status).toBe(400);

    const active = await request(app).get("/users/getActiveRide").query({ email: PASSENGER });
    expect(active.body).toMatchObject({ status: "accepted", taxiOrigin: "Slavija", taxiWaitingTime: 300, licence_plate: "BG-123-AB" });
    expect((await request(app).get("/drivers/getActiveRide").query({ email: DRIVER })).body.client).toBe(PASSENGER);

    expect((await request(app).get("/drivers/rideFinished").query({ email: PASSENGER })).body).toEqual({ message: "uspesno" });
    const history = await request(app).get("/users/getRides").query({ email: PASSENGER });
    expect(history.body.Ride).toHaveLength(1);

    const today = await request(app).get("/drivers/getTodayStatistic").query({ email: DRIVER });
    expect(today.body).toMatchObject({ numOfRides: 1, totalKms: 4.2 });
    const week = await request(app).get("/drivers/getStatistic").query({ email: DRIVER });
    expect(week.body.daysStatisticModel).toHaveLength(7);
    expect(week.body.daysStatisticModel[6].numOfRides).toBe(1);
    const year = await request(app).get("/drivers/getMonthStatistic").query({ email: DRIVER });
    expect(year.body.daysStatisticModel).toHaveLength(12);
    expect(year.body.daysStatisticModel.reduce((n: number, m: { numOfRides: number }) => n + m.numOfRides, 0)).toBe(1);
  });

  it("allows only one open ride per passenger", async () => {
    await quote();
    await request(app).get("/users/userRideResponse").query({ response: "true", email: PASSENGER, token: "t" });
    expect((await quote()).body).toEqual({ message: "You already have a drive scheduled" });
  });

  it("declining a quote removes it", async () => {
    await quote();
    const res = await request(app).get("/users/userRideResponse").query({ response: "false", email: PASSENGER });
    expect(res.body).toEqual({ message: "declined" });
    expect(await Ride.countDocuments({ user_email: PASSENGER })).toBe(0);
  });

  it("cancels the request when no driver accepts in time", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    try {
      await quote();
      await request(app).get("/users/userRideResponse").query({ response: "true", email: PASSENGER, token: "t" });
      await vi.waitFor(() => expect(vi.getTimerCount()).toBe(1));
      await vi.advanceTimersByTimeAsync(30_000);
      await vi.waitFor(async () => expect((await Ride.findOne({ user_email: PASSENGER }))?.status).toBe("canceled"));
    } finally {
      vi.useRealTimers();
    }
  });

  it("irregular passengers cannot order rides", async () => {
    await User.updateOne({ email: PASSENGER }, { regular: false });
    expect((await quote()).body).toEqual({ message: "User isnt regular" });
  });

  it("ignores operator injection through query parameters", async () => {
    const res = await request(app).get("/drivers/getActiveRide").query("email[$ne]=x");
    expect(res.status).toBe(400);
  });
});

describe("driver settings", () => {
  it("serves runtime settings from the database", async () => {
    expect((await request(app).get("/drivers/getRideWaitingDuration")).body).toEqual({ value: 30 });
    expect((await request(app).get("/drivers/getMaxDistance")).body).toEqual({ value: 20 });
    expect((await request(app).get("/drivers/getLocationRefreshTime")).body).toEqual({ value: 5 });
  });

  it("toggles availability", async () => {
    await request(app).post("/drivers/changeActivity").query({ email: DRIVER, availability: "false" });
    expect((await User.findOne({ email: DRIVER }))?.availability).toBe("unavailable");
  });
});
