import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import compression from "compression";

dotenv.config();

const api = express();

api.use(express.json({ limit: "10mb" }));
api.use(express.urlencoded({ limit: "10mb", extended: true }));
api.use(cookieParser());

api.use(
  cors({
    origin: true,
    credentials: true,
  })
);

api.use(compression());

import authRouter from "./routes/auth.js";

api.use(authRouter);

api.get("/", (req, res) => {
  res.json({ message: "API is running ✅" });
});

export default api;
