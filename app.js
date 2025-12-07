// app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import connectDB from "./src/config/db.js"; // centralized DB connection
import ApiError from "./src/utils/ApiError.js";
import routes from "./src/routes/index.js";
// import { seedDefaultAdmin } from "./src/seeders/seedAdmin.js";
// import { seedCategories } from "./src/seeders/seedCategories.js";
// import { seedRoles } from "./src/seeders/seedRoles.js";
// import { seedStatesAndCities } from "./src/seeders/seedStatesAndCities.js";
// import { seedJobMeta } from "./src/seeders/seedJobMeta.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();

// Flag to track if DB is initialized (for serverless)
// let dbInitialized = false;

// -------------------- Initialize Database (for serverless compatibility) --------------------
// async function initializeDB() {
//   if (!dbInitialized) {
//   await connectDB();

//   // Seed only ONCE in local
//   if (process.env.NODE_ENV !== "production") {
//     await seedDefaultAdmin();
//     await seedCategories();
//     await seedRoles();
//     await seedStatesAndCities();
//     await seedJobMeta();
//   }

//   dbInitialized = true;
// }

// }

// -------------------- CORS --------------------
app.use(
  cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000",          // React local
        "http://localhost:5173",          // Vite local
        "http://localhost:8080",          // Flutter web debug
        "http://192.168.29.45:3000",      // React on mobile WiFi
        "http://192.168.29.45:8080",      // Flutter web mobile
        "http://192.168.29.45:8000",      // API access from phone
        ...(process.env.CORS_ORIGIN?.split(",").map(o => o.trim()) || [])
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("🚫 Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


// -------------------- Middleware --------------------
// Note: express.json and express.urlencoded automatically skip multipart/form-data
// Multer will handle multipart/form-data requests
// Increased limits for JSON/URL-encoded data (though multipart/form-data is handled by multer)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(express.static("public"));
// Note: File uploads are now handled by Cloudinary, so static file serving for uploads is not needed

// -------------------- Middleware to ensure DB is initialized (for serverless) --------------------
// This must be before routes to ensure DB is connected before handling requests
// app.use(async (req, res, next) => {
//   if (!dbInitialized) {
//     await initializeDB();
//   }
//   next();
// });

// -------------------- Routes --------------------
app.use("/", routes);

app.get("/test", (req, res) => {
  res.json({ success: true, message: "Server is working! 🚀", timestamp: new Date().toISOString() });
});

// -------------------- Global Error Handler --------------------
app.use((err, req, res, next) => {
  // Enhanced error logging for debugging
  console.error("❌ Error Details:", {
    message: err.message,
    name: err.name,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    files: req.files ? Object.keys(req.files) : null,
  });

  // Handle multer file size errors
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "File too large. Maximum file size is 10MB per file.",
        data: null,
        meta: null,
      });
    }
    if (err.code === "LIMIT_FIELD_SIZE") {
      return res.status(413).json({
        success: false,
        message: "Request too large. Form field size exceeds 10MB limit.",
        data: null,
        meta: null,
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(413).json({
        success: false,
        message: "Too many files. Maximum 10 files allowed.",
        data: null,
        meta: null,
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
      data: null,
      meta: null,
    });
  }

  // Handle "Request Entity Too Large" errors
  if (err.status === 413 || err.statusCode === 413 || err.message?.includes("too large") || err.message?.includes("Request Entity Too Large")) {
    return res.status(413).json({
      success: false,
      message: "Request too large. Please reduce file sizes or form data size.",
      data: null,
      meta: null,
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
      meta: err.meta || null,
    });
  }

  // Return more details in development
  const isDevelopment = process.env.NODE_ENV === "development";
  
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    data: isDevelopment ? {
      error: err.message,
      name: err.name,
    } : null,
    meta: null,
  });
});

// -------------------- Start Server (only in local development) --------------------
// Vercel serverless functions don't need app.listen()


export default app;
