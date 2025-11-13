// Vercel serverless function entry point
// This file is required for Vercel to recognize and execute your Express app
import app from "../app.js";

// Export the Express app as the default export
// Vercel will use this as the serverless function handler
export default app;

