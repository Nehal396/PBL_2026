import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { connectDatabase } from "./config/db.js";
import { HttpError } from "./utils/http.js";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import bookingRoutes from "./routes/bookings.js";
import providerRoutes from "./routes/provider.js";
import adminRoutes from "./routes/admin.js";
import { notFound, errorHandler } from "./middleware/errors.js";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be set to a random value of at least 32 characters.");
}

const app = express();
const allowedOrigins = new Set((process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",").map((origin) => origin.trim()));
for (const deploymentHost of [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]) {
  if (deploymentHost) allowedOrigins.add(`https://${deploymentHost}`);
}
app.disable("x-powered-by");
if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
  credentials: true
}));
app.use(express.json({ limit: "100kb" }));
app.use((req, res, next) => {
  if (["POST", "PATCH", "PUT"].includes(req.method) && req.body !== undefined && (!req.body || typeof req.body !== "object" || Array.isArray(req.body))) {
    return next(new HttpError(400, "Send a JSON object in the request body."));
  }
  return next();
});
app.use(cookieParser());

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/provider", providerRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 5000;
await connectDatabase();
app.listen(port, () => console.info(`Rentix API listening on port ${port}.`));
