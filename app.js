import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";

dotenv.config();

const api = express();

// Parse JSON and URL-encoded data
api.use(express.json({ limit: "10mb" }));
api.use(express.urlencoded({ limit: "10mb", extended: true }));
api.use(cookieParser());
api.use(compression());

// ✅ Proper CORS configuration for deployed frontend
api.use(
  cors({
    origin: "https://inter-frontend-liard.vercel.app", // your frontend URL
    credentials: true, // allow cookies/auth if needed
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // allow all necessary methods
  })
);

// Handle preflight requests globally
api.options("*", cors());

// Routes
import authRouter from "./routes/auth.js";
api.use(authRouter);

// Test route
api.get("/", (req, res) => {
  res.json({ message: "API is running ✅" });
});

export default api;
