# OTP API - Postman JSON Data

## 📱 API 1: Send OTP

### **Endpoint:**
```
POST http://localhost:8000/api/job-seekers/send-otp
```

### **Headers:**
```
Content-Type: application/json
```

### **Request Body (JSON):**

#### **Option 1: For New User Registration**
```json
{
  "phone": "9876543210"
}
```

#### **Option 2: With Category (Optional)**
```json
{
  "phone": "9876543210",
  "category": "Diploma Holder"
}
```

**Note:** `category` is optional in `send-otp`. It will be required in `verify-otp` for new users.

---

### **Response:**
```json
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

**Response Fields:**
- `otp`: The OTP code (only returned in development/testing mode)
- `isExistingUser`: `true` if user exists (login), `false` if new user (registration)

---

## ✅ API 2: Verify OTP

### **Endpoint:**
```
POST http://localhost:8000/api/job-seekers/verify-otp
```

### **Headers:**
```
Content-Type: application/json
```

### **Request Body (JSON):**

#### **Option 1: For New User Registration**
```json
{
  "phone": "9876543210",
  "otp": "1234",
  "category": "Diploma Holder"
}
```

**Note:** `category` is **REQUIRED** for new users (registration flow).

---

#### **Option 2: For Existing User Login**
```json
{
  "phone": "9876543210",
  "otp": "1234"
}
```

**Note:** `category` is **optional** for existing users (login flow). If provided, it will update the category.

---

#### **Option 3: Login with Category Update**
```json
{
  "phone": "9876543210",
  "otp": "1234",
  "category": "ITI Holder"
}
```

**Note:** If user exists and category is provided, it will update the category.

---

### **Response (New User - Registration):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTQxOWMwMDMzMjRjMDZiY2RkZTdmOSIsInBob25lIjoiOTg3NjU0MzIxMCIsInJvbGUiOiJqb2Itc2Vla2VyIiwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTczNzA1NjgwMCwiZXhwIjoxNzM3MDU3NzAwfQ...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTQxOWMwMDMzMjRjMDZiY2RkZTdmOSIsInBob25lIjoiOTg3NjU0MzIxMCIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzM3MDU2ODAwLCJleHAiOjE3Mzc2NjE2MDB9...",
    "jobSeeker": {
      "_id": "691419c003324c06bcdde7f9",
      "phone": "9876543210",
      "phoneVerified": true,
      "category": "Diploma Holder",
      "role": "Worker",
      "registrationStep": 1,
      "isRegistrationComplete": false,
      "status": "Pending"
    }
  },
  "meta": null
}
```

---

### **Response (Existing User - Login):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "jobSeeker": {
      "_id": "691419c003324c06bcdde7f9",
      "phone": "9876543210",
      "phoneVerified": true,
      "category": "Diploma Holder",
      "role": "Worker",
      "registrationStep": 3,
      "isRegistrationComplete": false,
      "status": "Pending"
    }
  },
  "meta": null
}
```

---

## 📋 Complete Testing Flow

### **Scenario 1: New User Registration**

**Step 1: Send OTP**
```json
POST /api/job-seekers/send-otp
{
  "phone": "9876543210"
}
```

**Step 2: Verify OTP (Registration)**
```json
POST /api/job-seekers/verify-otp
{
  "phone": "9876543210",
  "otp": "1234",
  "category": "Diploma Holder"
}
```

**Response:** Returns `accessToken`, `refreshToken`, and `jobSeeker` data.

---

### **Scenario 2: Existing User Login**

**Step 1: Send OTP**
```json
POST /api/job-seekers/send-otp
{
  "phone": "9876543210"
}
```

**Step 2: Verify OTP (Login)**
```json
POST /api/job-seekers/verify-otp
{
  "phone": "9876543210",
  "otp": "1234"
}
```

**Response:** Returns `accessToken`, `refreshToken`, and `jobSeeker` data.

---

## 🔑 Important Notes

1. **OTP Value:** In development/testing mode, OTP is always `"1234"`. In production, it's a random 4-digit number.

2. **Category Values:** Must be one of:
   - `"Non-Degree Holder"`
   - `"Diploma Holder"`
   - `"ITI Holder"`

3. **Phone Number Format:** Must be a valid 10-digit Indian mobile number (starts with 6-9).

4. **Token Storage:** 
   - Save `accessToken` and `refreshToken` in your mobile app
   - Use `accessToken` for authenticated API requests
   - Use `refreshToken` to get new access tokens when expired

5. **Response Message:**
   - New user: `"OTP verified successfully"`
   - Existing user: `"Login successful"`

---

## ⚠️ Error Responses

### **Invalid Phone Number:**
```json
{
  "success": false,
  "message": "Phone number must be a valid 10-digit Indian mobile number",
  "data": null,
  "meta": null
}
```

### **Invalid OTP:**
```json
{
  "success": false,
  "message": "Invalid or expired OTP",
  "data": null,
  "meta": null
}
```

### **Category Required (New User):**
```json
{
  "success": false,
  "message": "Category is required for new user registration",
  "data": null,
  "meta": null
}
```

---

## 📱 Postman Collection Example

### **Request 1: Send OTP**
```
Method: POST
URL: http://localhost:8000/api/job-seekers/send-otp
Headers:
  Content-Type: application/json
Body (raw JSON):
{
  "phone": "9876543210"
}
```

### **Request 2: Verify OTP (Registration)**
```
Method: POST
URL: http://localhost:8000/api/job-seekers/verify-otp
Headers:
  Content-Type: application/json
Body (raw JSON):
{
  "phone": "9876543210",
  "otp": "1234",
  "category": "Diploma Holder"
}
```

### **Request 3: Verify OTP (Login)**
```
Method: POST
URL: http://localhost:8000/api/job-seekers/verify-otp
Headers:
  Content-Type: application/json
Body (raw JSON):
{
  "phone": "9876543210",
  "otp": "1234"
}
```

---

## 🎯 Quick Copy-Paste JSON

### **Send OTP:**
```json
{"phone": "9876543210"}
```

### **Verify OTP (Registration):**
```json
{"phone": "9876543210", "otp": "1234", "category": "Diploma Holder"}
```

### **Verify OTP (Login):**
```json
{"phone": "9876543210", "otp": "1234"}
```

