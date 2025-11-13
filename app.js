// app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./src/config/db.js"; // centralized DB connection
import ApiError from "./src/utils/ApiError.js";
import routes from "./src/routes/index.js";
import { seedDefaultAdmin } from "./src/seeders/seedAdmin.js";
import { seedCategories } from "./src/seeders/seedCategories.js";
import { seedRoles } from "./src/seeders/seedRoles.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();

// Flag to track if DB is initialized (for serverless)
let dbInitialized = false;

// -------------------- Initialize Database (for serverless compatibility) --------------------
async function initializeDB() {
  if (!dbInitialized) {
    await connectDB();
    await seedDefaultAdmin();
    await seedCategories();
    await seedRoles();
    dbInitialized = true;
  }
}

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
// Note: express.json and express.urlencoded automatically skip multipart/form-data
// Multer will handle multipart/form-data requests
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));
// Note: File uploads are now handled by Cloudinary, so static file serving for uploads is not needed

// -------------------- Middleware to ensure DB is initialized (for serverless) --------------------
// This must be before routes to ensure DB is connected before handling requests
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    await initializeDB();
  }
  next();
});

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

// -------------------- Start Server (only in local development) --------------------
// Vercel serverless functions don't need app.listen()
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = process.env.PORT || 8000;
  // Initialize DB before starting server
  initializeDB()
    .then(() => {
      app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    })
    .catch((err) => {
      console.error("Failed to start server:", err);
      process.exit(1);
    });
}

export default app;
