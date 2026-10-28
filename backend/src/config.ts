export const config = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/taxiprojekat",
  // Base URL of the deployed Firebase functions that send push notifications.
  // When unset (local development), notifications are only logged.
  functionsBaseUrl: process.env.FUNCTIONS_BASE_URL ?? "",
};
