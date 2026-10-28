import mongoose from "mongoose";

import { createApp } from "./app";
import { config } from "./config";

async function main() {
  await mongoose.connect(config.mongoUri);
  console.log("Connected to MongoDB");
  createApp().listen(config.port, () => console.log(`API listening on http://localhost:${config.port}`));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
