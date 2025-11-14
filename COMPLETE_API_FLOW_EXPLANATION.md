# Complete API Flow: From Request to Response

## 📋 Overview

This document explains the **entire flow** of an API request from the moment it hits the server until a response is sent back. We'll use the **`POST /api/job-seekers/send-otp`** API as a concrete example.

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                   1. CLIENT SENDS REQUEST                       │
│   POST http://localhost:8000/api/job-seekers/send-otp          │
│   Body: { "phone": "9876543210" }                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   2. EXPRESS APP RECEIVES REQUEST              │
│   File: app.js                                                  │
│   - Express server listens on port 8000                         │
│   - Request comes in via HTTP                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   3. MIDDLEWARE CHAIN (app.js)                  │
│   Line 38-60: CORS, JSON parsing, cookie parsing                │
│   Line 66-71: Database initialization check                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   4. ROUTE MATCHING                             │
│   File: src/routes/index.js                                     │
│   Line 26: app.use("/api/job-seekers", jobSeekerRoutes)        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   5. JOB SEEKER ROUTES                          │
│   File: src/routes/jobSeeker/jobSeeker.routes.js                │
│   Line 31-35: router.post("/send-otp", ...)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   6. VALIDATION MIDDLEWARE                      │
│   File: src/middlewares/jobSeeker/validateJobSeeker.js          │
│   - Validates request body using Joi schema                    │
│   - Normalizes data (trims whitespace)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   7. CONTROLLER                                 │
│   File: src/controllers/jobSeeker/jobSeeker.controller.js       │
│   Function: sendOTP()                                           │
│   - Business logic execution                                    │
│   - Database queries                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   8. MODELS & DATABASE                         │
│   - JobSeeker model queries MongoDB                            │
│   - OTP service generates and stores OTP                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   9. RESPONSE SENT                              │
│   - Success: 200 OK with data                                   │
│   - Error: 400/500 with error message                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Step-by-Step Detailed Flow

### **STEP 1: Client Sends Request**

**Example Request:**
```http
POST http://localhost:8000/api/job-seekers/send-otp
Content-Type: application/json

{
  "phone": "9876543210"
}
```

**What Happens:**
- Client (Postman, Mobile App, etc.) sends HTTP POST request
- Request includes URL, method, headers, and body

---

### **STEP 2: Express App Receives Request**

**File:** `app.js` (Lines 1-114)

**Code:**
```javascript
import express from "express";
const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/", routes);

// Error handler
app.use((err, req, res, next) => { ... });
```

**What Happens:**
1. Express receives the HTTP request
2. Request object (`req`) is created with:
   - `req.method` = "POST"
   - `req.url` = "/api/job-seekers/send-otp"
   - `req.body` = `{ phone: "9876543210" }` (after JSON parsing)
   - `req.headers` = Request headers
3. Response object (`res`) is created for sending response

---

### **STEP 3: Middleware Chain Execution**

**File:** `app.js` (Lines 38-71)

**Execution Order:**

#### **3.1 CORS Middleware** (Line 39-53)
```javascript
app.use(cors({
  origin: (origin, callback) => {
    // Check if origin is allowed
    // Allow or block request
  },
  credentials: true,
}));
```
**What Happens:**
- Checks if the request origin is allowed
- Sets CORS headers in response
- Calls `next()` to continue

#### **3.2 JSON Parser** (Line 58)
```javascript
app.use(express.json({ limit: "16kb" }));
```
**What Happens:**
- Parses JSON body from request
- Converts JSON string to JavaScript object
- Stores in `req.body`
- Calls `next()`

#### **3.3 Database Initialization** (Line 66-71)
```javascript
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    await initializeDB();  // Connect to MongoDB
  }
  next();
});
```
**What Happens:**
- Checks if database is connected
- If not, connects to MongoDB
- Calls `next()`

---

### **STEP 4: Route Matching**

**File:** `src/routes/index.js` (Line 26)

**Code:**
```javascript
import jobSeekerRoutes from "./jobSeeker/jobSeeker.routes.js";

router.use("/api/job-seekers", jobSeekerRoutes);
```

**What Happens:**
1. Express matches URL pattern `/api/job-seekers/*`
2. Forwards request to `jobSeekerRoutes` router
3. Removes `/api/job-seekers` prefix
4. Remaining path: `/send-otp`

---

### **STEP 5: Job Seeker Routes**

**File:** `src/routes/jobSeeker/jobSeeker.routes.js` (Lines 31-35)

**Code:**
```javascript
import { sendOTP } from "../../controllers/jobSeeker/jobSeeker.controller.js";
import { validateRequest } from "../../middlewares/jobSeeker/validateJobSeeker.js";
import { sendOTPSchema } from "../../validation/jobSeeker/jobSeeker.validation.js";

router.post(
  "/send-otp",
  validateRequest(sendOTPSchema),  // Middleware 1: Validation
  sendOTP                            // Middleware 2: Controller
);
```

**What Happens:**
1. Matches route `/send-otp` with POST method
2. Executes middleware in order:
   - First: `validateRequest(sendOTPSchema)`
   - Second: `sendOTP` controller

---

### **STEP 6: Validation Middleware**

**File:** `src/middlewares/jobSeeker/validateJobSeeker.js`

**Code Flow:**
```javascript
export const validateRequest = (schema, property = "body") =>
  asyncHandler(async (req, res, next) => {
    // 1. Extract data from request
    let data = req.body;  // { phone: "9876543210" }

    // 2. Normalize data (trim whitespace)
    const normalized = {};
    for (const [key, value] of Object.entries(data)) {
      const normalizedKey = key.trim();
      const normalizedValue = typeof value === "string" ? value.trim() : value;
      normalized[normalizedKey] = normalizedValue;
    }
    req.body = normalized;  // { phone: "9876543210" }

    // 3. Validate against Joi schema
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    // 4. If validation fails, throw error
    if (error) {
      const message = error.details.map((detail) => detail.message).join(", ");
      throw new ApiError(400, message);
    }

    // 5. Replace req.body with validated/sanitized data
    req.body = value;

    // 6. Call next() to continue to controller
    next();
  });
```

**Validation Schema** (`src/validation/jobSeeker/jobSeeker.validation.js`):
```javascript
export const sendOTPSchema = Joi.object({
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)  // Must be 10-digit Indian mobile number
    .required()
    .messages({
      "string.pattern.base": "Phone number must be a valid 10-digit Indian mobile number",
      "any.required": "Phone number is required",
    }),
  category: Joi.string()
    .valid("Non-Degree Holder", "Diploma Holder", "ITI Holder")
    .optional(),
});
```

**What Happens:**
1. ✅ Extracts `req.body` = `{ phone: "9876543210" }`
2. ✅ Normalizes (trims whitespace)
3. ✅ Validates against `sendOTPSchema`:
   - Checks `phone` matches pattern `^[6-9]\d{9}$`
   - Checks `phone` is required
   - Checks `category` is optional and valid if provided
4. ✅ If valid: Updates `req.body` with validated data
5. ✅ If invalid: Throws `ApiError(400, "Phone number must be...")`
6. ✅ Calls `next()` to proceed to controller

**If Validation Fails:**
- Error is caught by `asyncHandler`
- Error handler in `app.js` sends response:
  ```json
  {
    "success": false,
    "message": "Phone number must be a valid 10-digit Indian mobile number",
    "data": null
  }
  ```

---

### **STEP 7: Controller Execution**

**File:** `src/controllers/jobSeeker/jobSeeker.controller.js` (Lines 20-63)

**Code:**
```javascript
export const sendOTP = asyncHandler(async (req, res) => {
  // 1. Extract data from validated request body
  const { phone, category } = req.body;  // phone = "9876543210"

  // 2. Check if job seeker already exists
  const existingJobSeeker = await JobSeeker.findOne({ phone });
  // Database query: SELECT * FROM jobseekers WHERE phone = "9876543210"

  // 3. Determine purpose (login vs registration)
  const purpose = existingJobSeeker ? "login" : "registration";

  // 4. Generate and store OTP
  const otp = await storeOTP(phone, purpose);
  // This calls OTP service which:
  //   - Generates OTP ("1234" in dev, random in prod)
  //   - Saves to MongoDB OTP collection
  //   - Sets expiration (10 minutes)

  // 5. Log OTP (for testing)
  console.log(`OTP for ${phone} (${purpose}): ${otp}`);

  // 6. Determine if OTP should be returned in response
  const shouldReturnOTP = 
    process.env.NODE_ENV === "development" || 
    process.env.RETURN_OTP_IN_RESPONSE === "true" ||
    otp === "1234";

  // 7. Send success response
  return res.status(200).json(
    ApiResponse.success(
      { 
        otp: shouldReturnOTP ? otp : undefined,
        isExistingUser: !!existingJobSeeker
      },
      "OTP sent successfully"
    )
  );
});
```

**What Happens Step-by-Step:**

1. **Extract Data:**
   ```javascript
   const { phone, category } = req.body;
   // phone = "9876543210"
   // category = undefined (optional)
   ```

2. **Database Query:**
   ```javascript
   const existingJobSeeker = await JobSeeker.findOne({ phone });
   ```
   - Queries MongoDB `jobseekers` collection
   - Looks for document with `phone: "9876543210"`
   - Returns document if found, `null` if not found

3. **Determine Purpose:**
   ```javascript
   const purpose = existingJobSeeker ? "login" : "registration";
   ```
   - If user exists: `purpose = "login"`
   - If new user: `purpose = "registration"`

4. **Generate & Store OTP:**
   ```javascript
   const otp = await storeOTP(phone, purpose);
   ```
   - Calls `otpService.storeOTP()`
   - Generates OTP (see Step 8)
   - Stores in database

5. **Send Response:**
   ```javascript
   return res.status(200).json(ApiResponse.success({ ... }, "OTP sent successfully"));
   ```

---

### **STEP 8: OTP Service (Model Interaction)**

**File:** `src/utils/otpService.js` (Lines 29-50)

**Code:**
```javascript
export const storeOTP = async (phone, purpose = "registration") => {
  // 1. Delete any existing unverified OTPs for this phone
  await OTP.deleteMany({ phone, purpose, verified: false });
  // MongoDB: DELETE FROM otps WHERE phone = "9876543210" AND purpose = "registration" AND verified = false

  // 2. Generate new OTP
  const otp = generateOTP();  // Returns "1234" in dev, random in prod

  // 3. Set expiration (10 minutes from now)
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  // 4. Store OTP in database
  await OTP.create({
    phone: "9876543210",
    otp: "1234",
    expiresAt: expiresAt,  // e.g., 2024-01-15T10:10:00Z
    purpose: "registration",
    verified: false,
  });
  // MongoDB: INSERT INTO otps (phone, otp, expiresAt, purpose, verified) VALUES (...)

  return otp;  // Returns "1234"
};
```

**OTP Model** (`src/models/otp.model.js`):
```javascript
const otpSchema = new Schema({
  phone: { type: String, required: true, index: true },
  otp: { type: String, required: true, length: 4 },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
  purpose: { type: String, enum: ["registration", "login", "verification"] },
}, { timestamps: true });

export const OTP = model("OTP", otpSchema);
```

**What Happens:**
1. ✅ Deletes old OTPs for this phone
2. ✅ Generates new OTP ("1234" in dev)
3. ✅ Calculates expiration time
4. ✅ Creates new OTP document in MongoDB
5. ✅ Returns OTP value

**Database State After:**
```
OTP Collection:
┌─────────────────────────────────────────────────────────┐
│ _id: "..."                                              │
│ phone: "9876543210"                                     │
│ otp: "1234"                                             │
│ expiresAt: 2024-01-15T10:10:00Z                        │
│ purpose: "registration"                                 │
│ verified: false                                        │
│ createdAt: 2024-01-15T10:00:00Z                        │
└─────────────────────────────────────────────────────────┘
```

---

### **STEP 9: Response Sent Back**

**Response Object:**
```javascript
res.status(200).json({
  success: true,
  message: "OTP sent successfully",
  data: {
    otp: "1234",  // Only in dev/testing
    isExistingUser: false
  },
  meta: null
});
```

**HTTP Response:**
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "otp": "1234",
    "isExistingUser": false
  },
  "meta": null
}
```

**What Happens:**
1. ✅ `res.status(200)` sets HTTP status code
2. ✅ `res.json()` serializes object to JSON
3. ✅ Response sent to client
4. ✅ Client receives response

---

## ⚠️ Error Handling Flow

### **Scenario: Validation Error**

**Flow:**
```
1. Validation middleware throws ApiError(400, "Phone number must be...")
   ↓
2. asyncHandler catches error
   ↓
3. Error passed to next(error)
   ↓
4. Global error handler in app.js (Line 81-97) catches it
   ↓
5. Checks if error is ApiError instance
   ↓
6. Sends error response:
   {
     "success": false,
     "message": "Phone number must be a valid 10-digit Indian mobile number",
     "data": null
   }
```

**Code:**
```javascript
// app.js - Global Error Handler
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
      meta: err.meta || null,
    });
  }
  // Generic error
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    data: null,
  });
});
```

---

## 📊 Complete Request-Response Cycle

```
┌─────────────┐
│   CLIENT    │
│  (Postman)  │
└──────┬──────┘
       │
       │ POST /api/job-seekers/send-otp
       │ { "phone": "9876543210" }
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                    EXPRESS APP                          │
│  app.js                                                 │
│  ├─ CORS middleware                                     │
│  ├─ JSON parser                                         │
│  ├─ DB initialization                                   │
│  └─ Routes                                              │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                    ROUTES                               │
│  routes/index.js                                        │
│  └─ /api/job-seekers → jobSeekerRoutes                 │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│              JOB SEEKER ROUTES                          │
│  routes/jobSeeker/jobSeeker.routes.js                   │
│  └─ /send-otp → validateRequest → sendOTP              │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│              VALIDATION MIDDLEWARE                      │
│  middlewares/jobSeeker/validateJobSeeker.js             │
│  ├─ Extract req.body                                    │
│  ├─ Normalize data                                      │
│  ├─ Validate with Joi schema                            │
│  └─ If valid: next()                                    │
│     If invalid: throw ApiError                           │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                    CONTROLLER                           │
│  controllers/jobSeeker/jobSeeker.controller.js         │
│  ├─ Extract phone from req.body                        │
│  ├─ Query JobSeeker model                              │
│  ├─ Call OTP service                                    │
│  └─ Send response                                      │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                    MODELS & SERVICES                    │
│  ├─ JobSeeker.findOne() → MongoDB query                │
│  └─ OTP service:                                       │
│     ├─ Generate OTP                                     │
│     ├─ OTP.create() → MongoDB insert                    │
│     └─ Return OTP                                       │
└──────┬──────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────┐
│                    RESPONSE                             │
│  {                                                      │
│    "success": true,                                    │
│    "message": "OTP sent successfully",                  │
│    "data": { "otp": "1234", "isExistingUser": false }  │
│  }                                                      │
└──────┬──────────────────────────────────────────────────┘
       │
       │ HTTP 200 OK
       │
       ▼
┌─────────────┐
│   CLIENT    │
│  (Postman)  │
│  Receives   │
│  Response   │
└─────────────┘
```

---

## 🎯 Key Concepts

### **1. Middleware Chain**
- Middleware executes **in order**
- Each middleware can:
  - Modify `req` or `res`
  - Call `next()` to continue
  - Send response and stop chain

### **2. Route Matching**
- Express matches URL patterns **top to bottom**
- First match wins
- Route parameters extracted: `/users/:id` → `req.params.id`

### **3. Error Handling**
- `asyncHandler` wraps async functions
- Catches errors and passes to error handler
- `ApiError` for custom errors
- Global error handler sends formatted response

### **4. Database Interaction**
- Models define schema
- Controllers use models to query database
- Mongoose handles MongoDB operations
- Queries are async (use `await`)

### **5. Response Format**
- Consistent format via `ApiResponse.success()` or `ApiResponse.error()`
- Always includes: `success`, `message`, `data`, `meta`

---

## 📝 Summary

**Complete Flow:**
1. **Client** sends HTTP request
2. **Express** receives and parses request
3. **Middleware** processes (CORS, JSON, DB init)
4. **Routes** match URL pattern
5. **Validation** middleware validates request
6. **Controller** executes business logic
7. **Models** interact with database
8. **Response** sent back to client

**Key Files:**
- `app.js` - Express setup, middleware, error handling
- `routes/index.js` - Route mounting
- `routes/jobSeeker/jobSeeker.routes.js` - Route definitions
- `middlewares/jobSeeker/validateJobSeeker.js` - Validation
- `controllers/jobSeeker/jobSeeker.controller.js` - Business logic
- `models/` - Database schemas
- `utils/otpService.js` - Service functions

**Error Flow:**
- Validation error → `ApiError` → Global error handler → Response
- Database error → `asyncHandler` catches → Global error handler → Response

