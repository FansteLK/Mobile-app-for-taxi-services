// Driver endpoints. Paths, parameters and response bodies match what the Android app expects.
import { Router } from "express";

import { Ride, User, Value } from "../models";
import { notify } from "../notifications";
import { lastDays, monthsOfYear, type Range, summarize } from "../stats";
import { asyncHandler, queryString } from "./util";

export const driversRouter = Router();

const OK = { message: "uspesno" };
const FAILED = { message: "neuspesno" };

driversRouter.post(
  "/changeActivity",
  asyncHandler(async (req, res) => {
    const availability = req.query.availability === "false" ? "unavailable" : "available";
    const result = await User.updateOne({ email: queryString(req, "email") }, { $set: { availability } });
    res.status(result.matchedCount ? 200 : 400).json(result.matchedCount ? OK : FAILED);
  }),
);

// A driver within range of a scheduled ride: show them the request.
driversRouter.get(
  "/inRange",
  asyncHandler(async (req, res) => {
    const ride = await Ride.findOne({ user_email: queryString(req, "user"), status: "scheduled" });
    if (!ride) return res.status(400).json(FAILED);
    void notify("sendDriverNotification", {
      address: ride.origin,
      token: queryString(req, "token"),
      destination: ride.destination,
      duration: queryString(req, "duration"),
    });
    res.status(200).json(OK);
  }),
);

// First driver to accept gets the ride; the atomic status check makes later accepts fail.
driversRouter.post(
  "/acceptRide",
  asyncHandler(async (req, res) => {
    const user = queryString(req, "user");
    const driverEmail = queryString(req, "driver");
    const duration = queryString(req, "duration");
    const ride = await Ride.findOneAndUpdate(
      { user_email: user, status: "scheduled" },
      {
        $set: {
          status: "accepted",
          driver: driverEmail,
          user_waiting_time: Number(duration),
          taxiOrigin: queryString(req, "taxiOrigin"),
        },
      },
      { new: true },
    );
    if (!ride) return res.status(400).json(FAILED);

    const driver = await User.findOne({ email: driverEmail });
    void notify("sendDriverAcceptedRide", { user });
    void notify("sendUserAcceptedRide", {
      waiting_time: duration,
      token: ride.user_token,
      licence_plate: driver?.licence_plate,
    });
    res.status(200).json(OK);
  }),
);

function setting(name: string, fallback: number) {
  return asyncHandler(async (_req, res) => {
    const value = await Value.findOne({ name });
    res.status(200).json({ value: value ? Number(value.value) : fallback });
  });
}

driversRouter.get("/getRideWaitingDuration", setting("request_waiting_duration", 61));
driversRouter.get("/getMaxDistance", setting("max_distance", 61));
driversRouter.get("/getLocationRefreshTime", setting("location_refresh_time", 61));

// Live location while driving to the passenger, relayed to the passenger's app.
driversRouter.post(
  "/sendDriverLocation",
  asyncHandler(async (req, res) => {
    const ride = await Ride.findOne({ driver: queryString(req, "email"), status: "accepted" });
    if (!ride) return res.status(400).json(FAILED);
    void notify("sendDriverLocationToUser", {
      token: ride.user_token,
      lat: queryString(req, "lat"),
      lon: queryString(req, "lon"),
    });
    res.status(200).json(OK);
  }),
);

driversRouter.get(
  "/getActiveRide",
  asyncHandler(async (req, res) => {
    const ride = await Ride.findOne({ driver: queryString(req, "email"), status: "accepted" });
    if (!ride) return res.status(400).json(FAILED);
    res.status(200).json({
      taxiOrigin: ride.taxiOrigin,
      userOrigin: ride.origin,
      userDestination: ride.destination,
      client: ride.user_email,
    });
  }),
);

// Passenger did not show up: they can no longer order rides.
driversRouter.post(
  "/setUserIrregular",
  asyncHandler(async (req, res) => {
    const user = await User.findOneAndUpdate({ email: queryString(req, "email") }, { $set: { regular: false } });
    res.status(user ? 200 : 400).json(user ? OK : FAILED);
  }),
);

driversRouter.get(
  "/rideFinished",
  asyncHandler(async (req, res) => {
    const ride = await Ride.findOneAndUpdate(
      { user_email: queryString(req, "email"), status: "accepted" },
      { $set: { status: "finished" } },
    );
    res.status(ride ? 200 : 400).json(ride ? OK : FAILED);
  }),
);

async function summaryFor(driver: string, range: Range) {
  const rides = await Ride.find({ driver, status: "finished", date: { $gte: range.start, $lt: range.end } });
  return summarize(rides);
}

driversRouter.get(
  "/getTodayStatistic",
  asyncHandler(async (req, res) => {
    const [today] = lastDays(new Date(), 1);
    res.status(200).json(await summaryFor(queryString(req, "email"), today));
  }),
);

// Last 7 days, oldest first.
driversRouter.get(
  "/getStatistic",
  asyncHandler(async (req, res) => {
    const email = queryString(req, "email");
    const days = await Promise.all(lastDays(new Date(), 7).map((range) => summaryFor(email, range)));
    res.status(200).json({ daysStatisticModel: days });
  }),
);

// January to December of the current year.
driversRouter.get(
  "/getMonthStatistic",
  asyncHandler(async (req, res) => {
    const email = queryString(req, "email");
    const months = await Promise.all(monthsOfYear(new Date()).map((range) => summaryFor(email, range)));
    res.status(200).json({ daysStatisticModel: months });
  }),
);
