# Job Seeker Login API - Current State & Recommendations

## 📋 Current Login Flow

### **✅ YES - You Have Login APIs, But They're OTP-Based**

Currently, job seekers use the **same OTP APIs** for both **registration** and **login**. The system automatically detects whether the user is new or existing.

---

## 🔄 Current Login Flow

### **Step 1: Send OTP (Same API as Registration)**

**API:** `POST /api/job-seekers/send-otp`

**Request:**
```json
{
  "phone": "9876543210"
}
```

**What Happens:**
- System checks if job seeker with this phone exists
- If exists: `purpose = "login"`
- If new: `purpose = "registration"`
- Generates and stores OTP

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "otp": "1234",
    "isExistingUser": true  // ← Indicates this is a login
  }
}
```

---

### **Step 2: Verify OTP (Same API as Registration)**

**API:** `POST /api/job-seekers/verify-otp`

**Request:**
```json
{
  "phone": "9876543210",
  "otp": "1234"
}
```

**What Happens:**
```javascript
// Controller logic (jobSeeker.controller.js - Line 71-120)
export const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, otp, category } = req.body;

  // 1. Check if user exists
  let jobSeeker = await JobSeeker.findOne({ phone });
  const purpose = jobSeeker ? "login" : "registration";  // ← Auto-detects login

  // 2. Verify OTP
  const isValid = await verifyOTPFromService(phone, otp, purpose);
  if (!isValid) {
    throw new ApiError(400, "Invalid or expired OTP");
  }
  
  if (!jobSeeker) {
    // New user - Registration flow
    jobSeeker = await JobSeeker.create({ ... });
  } else {
    // Existing user - Login flow ✅
    jobSeeker.phoneVerified = true;
    await jobSeeker.save();
  }

  // 3. Return job seeker data
  return res.status(200).json(
    ApiResponse.success(
      { jobSeeker },
      "OTP verified successfully"
    )
  );
});
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "jobSeeker": {
      "_id": "691419c003324c06bcdde7f9",
      "phone": "9876543210",
      "phoneVerified": true,
      "category": "Diploma Holder",
      "registrationStep": 3,
      "isRegistrationComplete": false,
      // ... other fields
    }
  }
}
```

---

## ⚠️ Current Limitations

### **1. No JWT Token Generation**

**Problem:**
- After login, job seeker receives only their data
- **No authentication token** is generated
- Cannot maintain authenticated session
- Cannot protect routes that require authentication

**Current Response:**
```json
{
  "data": {
    "jobSeeker": { ... }  // ← No token!
  }
}
```

**What's Missing:**
```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",  // ← Should have this
    "jobSeeker": { ... }
  }
}
```

---

### **2. No Protected Routes**

**Problem:**
- No way to verify if a request is from an authenticated job seeker
- Cannot protect APIs like:
  - Update profile
  - View applications
  - Update preferences
  - etc.

---

## ✅ Recommended Solution: Add JWT Token Generation

### **Option 1: Modify Existing `verifyOTP` to Generate Token**

**Update:** `src/controllers/jobSeeker/jobSeeker.controller.js`

```javascript
import jwt from "jsonwebtoken";

export const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, otp, category } = req.body;

  let jobSeeker = await JobSeeker.findOne({ phone });
  const purpose = jobSeeker ? "login" : "registration";

  const isValid = await verifyOTPFromService(phone, otp, purpose);
  if (!isValid) {
    throw new ApiError(400, "Invalid or expired OTP");
  }
  
  if (!jobSeeker) {
    // Registration flow
    jobSeeker = await JobSeeker.create({
      phone,
      phoneVerified: true,
      category,
      registrationStep: 1,
    });
  } else {
    // Login flow
    jobSeeker.phoneVerified = true;
    await jobSeeker.save();
  }

  // ✅ NEW: Generate JWT token
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
  if (!accessTokenSecret) {
    throw new ApiError(500, "Access token secret is not configured");
  }

  const token = jwt.sign(
    { 
      id: jobSeeker._id.toString(), 
      role: "job-seeker",
      phone: jobSeeker.phone 
    },
    accessTokenSecret,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "7d", // 7 days for mobile app
    }
  );

  // Remove sensitive data
  const safeJobSeeker = {
    _id: jobSeeker._id,
    phone: jobSeeker.phone,
    category: jobSeeker.category,
    registrationStep: jobSeeker.registrationStep,
    isRegistrationComplete: jobSeeker.isRegistrationComplete,
    // ... other safe fields
  };

  return res.status(200).json(
    ApiResponse.success(
      { 
        token,  // ✅ Include token
        jobSeeker: safeJobSeeker 
      },
      purpose === "login" ? "Login successful" : "OTP verified successfully"
    )
  );
});
```

**Updated Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "jobSeeker": {
      "_id": "691419c003324c06bcdde7f9",
      "phone": "9876543210",
      "category": "Diploma Holder",
      "registrationStep": 3
    }
  }
}
```

---

### **Option 2: Create Separate Login Endpoint**

**New Route:** `POST /api/job-seekers/login`

**Benefits:**
- Clear separation between registration and login
- Can add additional login logic (e.g., check registration status)
- Better API design

**Implementation:**
```javascript
// src/routes/jobSeeker/jobSeeker.routes.js
router.post("/login", validateRequest(loginSchema), loginJobSeeker);

// src/controllers/jobSeeker/jobSeeker.controller.js
export const loginJobSeeker = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  // 1. Find job seeker
  const jobSeeker = await JobSeeker.findOne({ phone });
  if (!jobSeeker) {
    throw new ApiError(404, "Job seeker not found. Please register first.");
  }

  // 2. Verify OTP
  const isValid = await verifyOTPFromService(phone, otp, "login");
  if (!isValid) {
    throw new ApiError(400, "Invalid or expired OTP");
  }

  // 3. Generate JWT token
  const token = jwt.sign(
    { id: jobSeeker._id.toString(), role: "job-seeker" },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  // 4. Return token and user data
  return res.status(200).json(
    ApiResponse.success(
      { token, jobSeeker },
      "Login successful"
    )
  );
});
```

---

## 🔐 Add Authentication Middleware

**File:** `src/middlewares/jobSeeker/authJobSeeker.js`

```javascript
import jwt from "jsonwebtoken";
import ApiError from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { JobSeeker } from "../../models/jobSeeker/jobSeeker.model.js";

export const verifyJobSeekerJWT = asyncHandler(async (req, res, next) => {
  // 1. Get token from header
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized - No token provided");
  }

  // 2. Verify token
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  // 3. Find job seeker
  const jobSeeker = await JobSeeker.findById(decoded.id);
  if (!jobSeeker) {
    throw new ApiError(401, "Unauthorized - Job seeker not found");
  }

  // 4. Attach job seeker to request
  req.jobSeeker = jobSeeker;
  req.jobSeekerId = jobSeeker._id;

  next();
});
```

**Usage in Routes:**
```javascript
// Protect a route
router.get(
  "/profile",
  verifyJobSeekerJWT,  // ← Authentication middleware
  getJobSeekerProfile
);

// Controller can access authenticated user
export const getJobSeekerProfile = asyncHandler(async (req, res) => {
  const jobSeeker = req.jobSeeker;  // ← From middleware
  return res.json(ApiResponse.success({ jobSeeker }, "Profile fetched"));
});
```

---

## 📝 Complete Login Flow (Recommended)

### **Step 1: Request OTP for Login**

```
POST /api/job-seekers/send-otp
{
  "phone": "9876543210"
}

Response:
{
  "success": true,
  "data": {
    "otp": "1234",
    "isExistingUser": true
  }
}
```

### **Step 2: Verify OTP & Get Token**

```
POST /api/job-seekers/verify-otp
{
  "phone": "9876543210",
  "otp": "1234"
}

Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "jobSeeker": {
      "_id": "...",
      "phone": "9876543210",
      "category": "Diploma Holder",
      "registrationStep": 3
    }
  }
}
```

### **Step 3: Use Token for Authenticated Requests**

```
GET /api/job-seekers/profile
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Response:
{
  "success": true,
  "data": {
    "jobSeeker": { ... }
  }
}
```

---

## 📊 Summary

### **Current State:**
- ✅ Login APIs exist (`send-otp` and `verify-otp`)
- ✅ System auto-detects login vs registration
- ❌ No JWT token generation
- ❌ No protected routes

### **Recommended:**
- ✅ Add JWT token generation in `verifyOTP`
- ✅ Create authentication middleware
- ✅ Protect routes that require authentication
- ✅ Return token in login response

---

## 🎯 Quick Answer

**Q: Do I have a login API after registration?**

**A: YES, but it's OTP-based:**
- `POST /api/job-seekers/send-otp` - Request OTP
- `POST /api/job-seekers/verify-otp` - Verify OTP (works for both registration and login)

**The system automatically detects:**
- If user exists → **Login flow**
- If new user → **Registration flow**

**However, you should add:**
- JWT token generation after successful login
- Authentication middleware for protected routes

