// src/app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./src/config/db.js"; // centralized DB connection
import ApiError from "./src/utils/ApiError.js";
import routes from "./src/routes/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

// -------------------- Connect to MongoDB --------------------
await connectDB(); // must await before using sessions

// -------------------- CORS --------------------
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins =
        process.env.CORS_ORIGIN?.split(",").map((o) => o.trim()) || [];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// -------------------- Middleware --------------------
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));

// -------------------- Session --------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI, // must be full URI
      collectionName: "sessions",
      ttl: 60 * 60,
      autoRemove: "native",
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
      maxAge: 60 * 60 * 1000,
    },
  })
);

// -------------------- Routes --------------------
app.use("/", routes);

app.get("/test", (req, res) => {
  res.json({ success: true, message: "Server is working! 🚀", timestamp: new Date().toISOString() });
});

// -------------------- Global Error Handler --------------------
app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
      meta: err.meta || null,
    });
  }
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    data: null,
    meta: null,
  });
});

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

export default app;
