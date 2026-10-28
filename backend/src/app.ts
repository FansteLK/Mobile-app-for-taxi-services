import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";

import { driversRouter } from "./routes/drivers";
import { usersRouter } from "./routes/users";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/users", usersRouter);
  app.use("/drivers", driversRouter);

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(500).json({ message: "error" });
  });
  return app;
}
