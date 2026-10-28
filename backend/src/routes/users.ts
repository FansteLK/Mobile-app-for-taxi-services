// Passenger endpoints. Paths, parameters and response bodies match what the Android app expects.
import bcrypt from "bcryptjs";
import { Router } from "express";

import { Ride, Tariff, User, Value } from "../models";
import { notify } from "../notifications";
import { estimatePrice, isNight, isWeekend } from "../pricing";
import { asyncHandler, queryString } from "./util";

const DEFAULT_REQUEST_WAITING_SECONDS = 61;
const OPEN_RIDE = { $in: ["scheduled", "accepted"] };

export const usersRouter = Router();

usersRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "User does not exist" });
    if (!(await bcrypt.compare(String(password ?? ""), user.password ?? ""))) {
      return res.status(400).json({ error: "Invalid Password" });
    }
    if (!user.regular) return res.status(400).json({ error: "User isnt regular" });
    res.status(200).json(user); // the password hash is stripped by the model's toJSON
  }),
);

usersRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, number } = req.body ?? {};
    if (!email || !password || !number) return res.status(400).json({ message: "error" });
    if (await User.exists({ email })) {
      return res.status(400).json({ message: "The email is already linked to another account" });
    }
    if (await User.exists({ number })) {
      return res.status(400).json({ message: "The number is already linked to another account" });
    }
    await User.create({
      email,
      password: await bcrypt.hash(String(password), 10),
      number,
      type: "user",
      availability: null,
      regular: true,
    });
    res.status(200).json({ message: "user added" });
  }),
);

// Quote a price from Google Maps distance/duration data and create a ride awaiting confirmation.
usersRouter.get(
  "/requestPrice",
  asyncHandler(async (req, res) => {
    const email = queryString(req, "user_email");
    const now = new Date();

    // Drop quotes the passenger never confirmed.
    await Ride.deleteMany({ user_email: email, status: "" });
    if (await Ride.exists({ user_email: email, status: OPEN_RIDE })) {
      return res.status(400).json({ message: "You already have a drive scheduled" });
    }
    if (!(await User.exists({ email, regular: true }))) {
      return res.status(400).json({ message: "User isnt regular" });
    }
    const tariff = await Tariff.findOne({ night: isNight(now), weekend: isWeekend(now), holiday: false });
    if (!tariff) return res.status(400).json({ message: "error" });

    const distanceKm = Number(req.query.distance) / 1000;
    const durationInTraffic = Number(req.query.traffic_duration);
    const price = estimatePrice(
      { starting_price: tariff.starting_price ?? 0, price_per_km: tariff.price_per_km ?? 0 },
      { distanceKm, duration: Number(req.query.duration), durationInTraffic },
    );
    await Ride.create({
      user_email: email,
      origin: queryString(req, "origin"),
      destination: queryString(req, "destination"),
      estimated_price: price,
      estimated_duration: durationInTraffic,
      distance: distanceKm,
      status: "",
      date: now,
    });
    res.status(200).json({ price: price.toFixed(2) });
  }),
);

// The passenger accepts or declines the quoted price. Accepting broadcasts the request to nearby drivers;
// if no driver accepts within request_waiting_duration seconds the ride is canceled.
usersRouter.get(
  "/userRideResponse",
  asyncHandler(async (req, res) => {
    const email = queryString(req, "email");
    const token = queryString(req, "token");

    if (req.query.response !== "true") {
      await Ride.deleteMany({ user_email: email, status: { $in: ["", "scheduled"] } });
      return res.status(400).json({ message: "declined" });
    }
    if (!(await User.exists({ email, regular: true }))) {
      return res.status(400).json({ message: "User isnt regular" });
    }
    const ride = await Ride.findOneAndUpdate(
      { user_email: email, status: "" },
      { $set: { user_token: token, status: "scheduled" } },
      { new: true },
    );
    if (!ride) return res.status(400).json({ message: "neuspesno" });

    void notify("sendDriverDistanceRequest", { address: ride.origin, user: email, dstAddress: ride.destination });
    res.status(200).json({ message: "uspesno" });

    const setting = await Value.findOne({ name: "request_waiting_duration" });
    const waitSeconds = Number(setting?.value ?? DEFAULT_REQUEST_WAITING_SECONDS);
    setTimeout(async () => {
      const canceled = await Ride.findOneAndUpdate(
        { _id: ride._id, status: "scheduled" },
        { $set: { status: "canceled" } },
      ).catch((error) => console.error(error));
      if (canceled) void notify("sendNoRide", { token });
    }, waitSeconds * 1000).unref();
  }),
);

usersRouter.get(
  "/getActiveRide",
  asyncHandler(async (req, res) => {
    const ride = await Ride.findOne({ user_email: queryString(req, "email"), status: OPEN_RIDE });
    if (!ride) return res.status(400).json({ message: "neuspesno" });
    if (ride.status === "scheduled") return res.status(200).json({ status: ride.status });

    const driver = await User.findOne({ email: ride.driver });
    res.status(200).json({
      status: ride.status,
      taxiOrigin: ride.taxiOrigin,
      userOrigin: ride.origin,
      userDestination: ride.destination,
      price: ride.estimated_price,
      taxiWaitingTime: ride.user_waiting_time,
      licence_plate: driver?.licence_plate,
    });
  }),
);

usersRouter.get(
  "/getRides",
  asyncHandler(async (req, res) => {
    const rides = await Ride.find({ user_email: queryString(req, "email"), status: "finished" }).sort({ date: -1 });
    res.status(200).json({ Ride: rides });
  }),
);
