# Vercel Deployment Guide

## ✅ Changes Made for Vercel Compatibility

### 1. **Created `/api/index.js`** (Serverless Function Entry Point)
- This is the file Vercel looks for to execute your Express app
- It imports and exports your Express app from `app.js`

### 2. **Refactored `app.js`** for Serverless Compatibility
- **Removed top-level `await`**: Changed from top-level await to lazy initialization
- **Added `initializeDB()` function**: Database connection now happens on first request (serverless-friendly)
- **Conditional server start**: `app.listen()` only runs in local development, not on Vercel
- **DB initialization middleware**: Ensures database is connected before handling any request

### 3. **Created `vercel.json`** (Optional Configuration)
- Helps Vercel understand your project structure
- Routes all requests to the serverless function

---

## 📁 Project Structure

```
shramikBackend/
├── api/
│   └── index.js          ← NEW: Vercel serverless function entry point
├── app.js                ← MODIFIED: Now serverless-compatible
├── vercel.json           ← NEW: Vercel configuration
├── package.json
├── .env                  ← Your environment variables
└── src/
    ├── routes/
    ├── controllers/
    ├── models/
    └── ...
```

---

## 🚀 Deployment Steps

### **Step 1: Install Vercel CLI (if not already installed)**
```bash
npm install -g vercel
```

### **Step 2: Login to Vercel**
```bash
vercel login
```

### **Step 3: Deploy**
```bash
# From your project root (shramikBackend/)
vercel
```

Or deploy to production:
```bash
vercel --prod
```

### **Step 4: Set Environment Variables**
In Vercel Dashboard:
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add all variables from your `.env` file:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CORS_ORIGIN`
   - `PORT` (optional, Vercel sets this automatically)
   - Any other environment variables you use

---

## 🔧 How It Works

### **Local Development**
- Runs normally with `npm start` or `npm run dev`
- Database connects on server startup
- Server listens on port 8000 (or PORT from env)

### **Vercel Serverless**
- Each request triggers the serverless function
- Database connects on first request (lazy initialization)
- No `app.listen()` needed (Vercel handles HTTP server)
- Subsequent requests reuse the connection (if within the same execution context)

---

## ⚠️ Important Notes

### **1. Database Connection**
- In serverless, the database connection is initialized on the first request
- MongoDB connections are cached per serverless function instance
- This is efficient and works well with Vercel's serverless architecture

### **2. File Uploads**
- **⚠️ Vercel serverless functions have a 4.5MB request body limit**
- For file uploads, consider using:
  - **Vercel Blob Storage** (recommended)
  - **AWS S3** or **Cloudinary**
  - **External file storage service**

### **3. Environment Variables**
- Make sure all environment variables are set in Vercel Dashboard
- Never commit `.env` file to Git
- Use Vercel's environment variables for production secrets

### **4. Cold Starts**
- First request after inactivity may be slower (cold start)
- Subsequent requests are fast (warm start)
- This is normal for serverless functions

---

## 🧪 Testing After Deployment

### **1. Test Root Endpoint**
```
GET https://your-project.vercel.app/
```

### **2. Test API Endpoint**
```
GET https://your-project.vercel.app/api/job-seekers/categories
```

### **3. Test Health Check**
```
GET https://your-project.vercel.app/test
```

---

## 🔍 Troubleshooting

### **Issue: "Function not found" or 404 errors**
- **Solution**: Make sure `/api/index.js` exists and exports the app correctly
- Check that `vercel.json` is configured properly

### **Issue: Database connection errors**
- **Solution**: 
  - Verify `MONGODB_URI` is set in Vercel environment variables
  - Check MongoDB Atlas IP whitelist (add `0.0.0.0/0` for Vercel)
  - Ensure MongoDB connection string is correct

### **Issue: CORS errors**
- **Solution**: 
  - Set `CORS_ORIGIN` environment variable in Vercel
  - Include your frontend domain(s) in the CORS_ORIGIN

### **Issue: File upload errors (413 Payload Too Large)**
- **Solution**: 
  - Vercel has a 4.5MB limit for request body
  - Use external file storage (Vercel Blob, S3, Cloudinary) for file uploads

### **Issue: Routes not working**
- **Solution**: 
  - Check that routes are properly mounted in `src/routes/index.js`
  - Verify API paths start with `/api/` (e.g., `/api/job-seekers/...`)

---

## 📝 Vercel Configuration (`vercel.json`)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

## 🎯 Next Steps

1. ✅ Deploy to Vercel
2. ✅ Set environment variables
3. ✅ Test all API endpoints
4. ⚠️ **Consider migrating file uploads to external storage** (Vercel Blob/S3/Cloudinary)
5. ✅ Update frontend API base URL to your Vercel domain

---

## 📚 Additional Resources

- [Vercel Serverless Functions Docs](https://vercel.com/docs/functions)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob)

---

**Happy Deploying! 🚀**

