# JWT Authentication Implementation for Job Seekers

## ✅ Implementation Complete

This document explains the complete JWT authentication system implemented for job seekers, including access tokens, refresh tokens, and authentication middleware.

---

## 📋 What Was Implemented

### **Step 1: JWT Token Utility Functions** ✅

**File:** `src/utils/jwtToken.js`

**Functions Created:**
- `generateAccessToken(payload)` - Generates short-lived access token (15 minutes)
- `generateRefreshToken(payload)` - Generates long-lived refresh token (7 days)
- `verifyAccessToken(token)` - Verifies access token signature and expiration
- `verifyRefreshToken(token)` - Verifies refresh token signature and expiration

**Key Features:**
- Access tokens expire in 15 minutes (configurable via `ACCESS_TOKEN_EXPIRY`)
- Refresh tokens expire in 7 days (configurable via `REFRESH_TOKEN_EXPIRY`)
- Tokens include `type` field to distinguish access vs refresh tokens
- Uses separate secrets for access and refresh tokens

---

### **Step 2: Updated JobSeeker Model** ✅

**File:** `src/models/jobSeeker/jobSeeker.model.js`

**Changes:**
- Added `refreshToken` field to store refresh token in database
- Field is excluded from queries by default (`select: false`) for security
- Can be explicitly included with `.select("+refreshToken")`

**Schema Addition:**
```javascript
refreshToken: {
  type: String,
  default: null,
  select: false, // Don't include in queries by default (security)
}
```

---

### **Step 3: Updated verifyOTP Controller** ✅

**File:** `src/controllers/jobSeeker/jobSeeker.controller.js`

**What Changed:**
1. **Imports:** Added `generateAccessToken`, `generateRefreshToken`
2. **Token Generation:** After OTP verification, generates both tokens
3. **Token Storage:** Saves refresh token to database
4. **Response:** Returns both tokens in response
5. **Cookie:** Sets refresh token as HTTP-only cookie (for web apps)

**New Response Structure:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "jobSeeker": {
      "_id": "...",
      "phone": "9876543210",
      "category": "Diploma Holder",
      ...
    }
  }
}
```

---

### **Step 4: Authentication Middleware** ✅

**File:** `src/middlewares/jobSeeker/authJobSeeker.js`

**Function:** `verifyJobSeekerJWT`

**What It Does:**
1. Extracts token from `Authorization` header or cookie
2. Verifies token signature and expiration
3. Checks token type (must be "access")
4. Finds job seeker in database
5. Verifies job seeker is active
6. Attaches job seeker to `req.jobSeeker` and `req.jobSeekerId`

**Usage:**
```javascript
import { verifyJobSeekerJWT } from "../../middlewares/jobSeeker/authJobSeeker.js";

router.get("/profile", verifyJobSeekerJWT, getProfile);
```

**Error Handling:**
- `401` - No token provided
- `401` - Token expired
- `401` - Invalid token
- `401` - Job seeker not found
- `403` - Account inactive

---

### **Step 5: Refresh Token Endpoint** ✅

**File:** `src/controllers/jobSeeker/jobSeeker.controller.js`
**Function:** `refreshAccessToken`
**Route:** `POST /api/job-seekers/refresh-token`

**What It Does:**
1. Accepts refresh token from request body or cookie
2. Verifies refresh token signature and expiration
3. Finds job seeker and verifies stored refresh token matches
4. Generates new access token
5. **Token Rotation:** Generates new refresh token (security best practice)
6. Saves new refresh token to database
7. Returns new tokens

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Access token refreshed successfully",
  "data": {
    "accessToken": "new_access_token...",
    "refreshToken": "new_refresh_token..." // Token rotation
  }
}
```

**Security Features:**
- Token rotation (new refresh token issued each time)
- Token mismatch detection (invalidates tokens if mismatch)
- Account status verification

---

### **Step 6: Logout Endpoint** ✅

**File:** `src/controllers/jobSeeker/jobSeeker.controller.js`
**Function:** `logoutJobSeeker`
**Route:** `POST /api/job-seekers/logout`

**What It Does:**
1. Accepts refresh token from request body or cookie
2. Finds job seeker by refresh token
3. Removes refresh token from database (invalidates it)
4. Clears refresh token cookie
5. Returns success response

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful",
  "data": null
}
```

**Note:** Access tokens cannot be invalidated (they're stateless), but they expire naturally in 15 minutes.

---

### **Step 7: Routes Updated** ✅

**File:** `src/routes/jobSeeker/jobSeeker.routes.js`

**New Routes Added:**
```javascript
// Refresh Token Route
router.post("/refresh-token", refreshAccessToken);

// Logout Route
router.post("/logout", logoutJobSeeker);
```

---

## 🔐 Environment Variables Required

Add these to your `.env` file:

```env
# JWT Secrets (use strong random strings)
ACCESS_TOKEN_SECRET=your_super_secret_access_token_key_here
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key_here

# Token Expiration (optional - defaults shown)
ACCESS_TOKEN_EXPIRY=15m    # 15 minutes
REFRESH_TOKEN_EXPIRY=7d    # 7 days
```

**Generate Secrets:**
```bash
# Generate random secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📱 Complete Authentication Flow

### **1. Registration/Login Flow**

```
Step 1: Request OTP
POST /api/job-seekers/send-otp
{ "phone": "9876543210" }

Step 2: Verify OTP & Get Tokens
POST /api/job-seekers/verify-otp
{ "phone": "9876543210", "otp": "1234" }

Response:
{
  "accessToken": "...",
  "refreshToken": "...",
  "jobSeeker": { ... }
}
```

### **2. Using Access Token**

```
Step 1: Store tokens in mobile app
- Save accessToken and refreshToken securely

Step 2: Use access token for authenticated requests
GET /api/job-seekers/profile
Headers:
  Authorization: Bearer <accessToken>
```

### **3. Token Refresh Flow**

```
Step 1: Access token expires (after 15 minutes)
Step 2: API returns 401 "Access token expired"
Step 3: Client calls refresh endpoint
POST /api/job-seekers/refresh-token
{ "refreshToken": "..." }

Step 4: Get new tokens
Response:
{
  "accessToken": "new_token...",
  "refreshToken": "new_refresh_token..."
}
```

### **4. Logout Flow**

```
POST /api/job-seekers/logout
{ "refreshToken": "..." }

Response:
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 🛡️ Protecting Routes

### **Example: Protected Profile Route**

**Route Definition:**
```javascript
import { verifyJobSeekerJWT } from "../../middlewares/jobSeeker/authJobSeeker.js";

router.get("/profile", verifyJobSeekerJWT, getJobSeekerProfile);
```

**Controller:**
```javascript
export const getJobSeekerProfile = asyncHandler(async (req, res) => {
  // req.jobSeeker is available from middleware
  const jobSeeker = req.jobSeeker;
  
  return res.status(200).json(
    ApiResponse.success(
      { jobSeeker },
      "Profile fetched successfully"
    )
  );
});
```

**Request:**
```http
GET /api/job-seekers/profile
Authorization: Bearer <accessToken>
```

---

## 📊 Token Structure

### **Access Token Payload:**
```json
{
  "id": "691419c003324c06bcdde7f9",
  "phone": "9876543210",
  "role": "job-seeker",
  "type": "access",
  "iat": 1234567890,
  "exp": 1234568790
}
```

### **Refresh Token Payload:**
```json
{
  "id": "691419c003324c06bcdde7f9",
  "phone": "9876543210",
  "type": "refresh",
  "iat": 1234567890,
  "exp": 1234571490
}
```

---

## 🔒 Security Features

1. **Token Rotation:** New refresh token issued on each refresh
2. **Token Mismatch Detection:** Invalidates tokens if mismatch detected
3. **Account Status Check:** Verifies account is active
4. **HTTP-Only Cookies:** Refresh tokens stored in secure cookies (web apps)
5. **Separate Secrets:** Different secrets for access and refresh tokens
6. **Short-Lived Access Tokens:** 15-minute expiration limits exposure
7. **Token Type Verification:** Ensures correct token type is used

---

## 📝 Testing in Postman

### **1. Login and Get Tokens**
```
POST http://localhost:8000/api/job-seekers/send-otp
Body: { "phone": "9876543210" }

POST http://localhost:8000/api/job-seekers/verify-otp
Body: { "phone": "9876543210", "otp": "1234" }
```

### **2. Use Access Token**
```
GET http://localhost:8000/api/job-seekers/profile
Headers:
  Authorization: Bearer <accessToken>
```

### **3. Refresh Token**
```
POST http://localhost:8000/api/job-seekers/refresh-token
Body: { "refreshToken": "<refreshToken>" }
```

### **4. Logout**
```
POST http://localhost:8000/api/job-seekers/logout
Body: { "refreshToken": "<refreshToken>" }
```

---

## ✅ Summary

**What We Did:**
1. ✅ Created JWT token utility functions
2. ✅ Updated JobSeeker model to store refresh tokens
3. ✅ Modified `verifyOTP` to generate and return tokens
4. ✅ Created authentication middleware
5. ✅ Added refresh token endpoint
6. ✅ Added logout endpoint
7. ✅ Updated routes

**Result:**
- Complete JWT authentication system
- Access tokens (15 min) for API requests
- Refresh tokens (7 days) for token renewal
- Secure token storage and validation
- Protected routes with middleware

**Next Steps:**
- Add protected routes (e.g., update profile, view applications)
- Test authentication flow
- Add token refresh logic to mobile app

