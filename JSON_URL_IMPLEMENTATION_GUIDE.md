# JSON URL Implementation Guide for Step 1 Registration

## Overview

This guide explains how to modify the `/api/job-seekers/register/step1` endpoint to accept file URLs in JSON format instead of file uploads via `multipart/form-data`.

## Current Implementation (File Upload)

**Current Flow:**
1. Client sends `multipart/form-data` with files
2. Multer middleware processes file uploads
3. Files are uploaded to Cloudinary
4. Cloudinary URLs are stored in database

**Current Route:**
```javascript
router.post(
  "/register/step1",
  uploadFields([...]),  // Multer middleware
  uploadToCloudinaryMiddleware,
  validateRequest(step1RegistrationSchema),
  step1Registration
);
```

## Alternative Implementation (JSON with URLs)

**New Flow:**
1. Client uploads files to Cloudinary separately (or uses existing URLs)
2. Client sends JSON with file URLs
3. Server validates URLs
4. URLs are stored directly in database

---

## Implementation Steps

### Step 1: Update Validation Schema

**File:** `src/validation/jobSeeker/jobSeeker.validation.js`

**Current:**
```javascript
export const step1RegistrationSchema = Joi.object({
  phone: phoneSchema,
  // Files handled via multer
});
```

**Modified:**
```javascript
// URL validation schema
const urlSchema = Joi.string()
  .uri({ scheme: ['http', 'https'] })
  .required()
  .messages({
    'string.uri': 'Must be a valid URL',
    'any.required': 'URL is required',
  });

// Step 1 Registration Schema (JSON with URLs)
export const step1RegistrationSchema = Joi.object({
  phone: phoneSchema,
  aadhaarCard: urlSchema,
  profilePhoto: urlSchema,
});
```

### Step 2: Update Route (Remove Multer)

**File:** `src/routes/jobSeeker/jobSeeker.routes.js`

**Current:**
```javascript
router.post(
  "/register/step1",
  uploadFields([
    { name: "aadhaarCard", maxCount: 1 },
    { name: "profilePhoto", maxCount: 1 },
  ]),
  uploadToCloudinaryMiddleware,
  validateRequest(step1RegistrationSchema),
  step1Registration
);
```

**Modified:**
```javascript
router.post(
  "/register/step1",
  validateRequest(step1RegistrationSchema),  // Only validation, no multer
  step1Registration
);
```

### Step 3: Update Controller

**File:** `src/controllers/jobSeeker/jobSeeker.controller.js`

**Current:**
```javascript
export const step1Registration = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  // Handle file uploads
  const aadhaarCard = req.files?.aadhaarCard?.[0]
    ? getFileUrl(req.files.aadhaarCard[0])
    : null;
  const profilePhoto = req.files?.profilePhoto?.[0]
    ? getFileUrl(req.files.profilePhoto[0])
    : null;

  if (!aadhaarCard) {
    throw new ApiError(400, "Aadhaar card is required");
  }
  if (!profilePhoto) {
    throw new ApiError(400, "Profile photo is required");
  }

  // ... rest of code
});
```

**Modified:**
```javascript
export const step1Registration = asyncHandler(async (req, res) => {
  const { phone, aadhaarCard, profilePhoto } = req.body;

  // URLs are already validated by Joi schema
  // Optional: Additional URL validation (e.g., check if URL is accessible)
  // Optional: Verify URLs are from Cloudinary (if you want to restrict sources)
  
  if (!aadhaarCard) {
    throw new ApiError(400, "Aadhaar card URL is required");
  }
  if (!profilePhoto) {
    throw new ApiError(400, "Profile photo URL is required");
  }

  // Find job seeker
  let jobSeeker = await JobSeeker.findOne({ phone });
  if (!jobSeeker || !jobSeeker.phoneVerified) {
    throw new ApiError(400, "Please verify your phone number first");
  }

  if (
    jobSeeker.category !== "Diploma Holder" &&
    jobSeeker.category !== "ITI Holder"
  ) {
    throw new ApiError(400, "Invalid category for this registration step");
  }

  // Store URLs directly (no file processing needed)
  jobSeeker.aadhaarCard = aadhaarCard;
  jobSeeker.profilePhoto = profilePhoto;
  jobSeeker.registrationStep = 2;

  await jobSeeker.save();

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { jobSeeker },
        "Step 1 completed successfully"
      )
    );
});
```

---

## Optional Enhancements

### 1. URL Source Validation (Restrict to Cloudinary)

If you want to ensure URLs are from Cloudinary:

```javascript
// In controller
const isValidCloudinaryUrl = (url) => {
  return url && (
    url.includes('cloudinary.com') || 
    url.includes('res.cloudinary.com')
  );
};

if (!isValidCloudinaryUrl(aadhaarCard)) {
  throw new ApiError(400, "Aadhaar card URL must be from Cloudinary");
}
if (!isValidCloudinaryUrl(profilePhoto)) {
  throw new ApiError(400, "Profile photo URL must be from Cloudinary");
}
```

### 2. URL Accessibility Check

Verify URLs are accessible (optional, adds latency):

```javascript
import axios from 'axios';

const verifyUrlAccessible = async (url) => {
  try {
    const response = await axios.head(url, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

// In controller
const isAadhaarAccessible = await verifyUrlAccessible(aadhaarCard);
if (!isAadhaarAccessible) {
  throw new ApiError(400, "Aadhaar card URL is not accessible");
}
```

### 3. Support Both Formats (Hybrid Approach)

Allow both file uploads AND URLs:

```javascript
// Route
router.post(
  "/register/step1",
  uploadFields([...]).optional(),  // Optional multer
  uploadToCloudinaryMiddleware,
  validateRequest(step1RegistrationSchema),
  step1Registration
);

// Validation Schema
export const step1RegistrationSchema = Joi.object({
  phone: phoneSchema,
  // Either files OR URLs
  aadhaarCard: Joi.string().uri().optional(),
  profilePhoto: Joi.string().uri().optional(),
}).or('aadhaarCard', 'files');  // At least one method

// Controller
export const step1Registration = asyncHandler(async (req, res) => {
  const { phone, aadhaarCard: aadhaarUrl, profilePhoto: photoUrl } = req.body;

  // Get URLs from either source
  const aadhaarCard = req.files?.aadhaarCard?.[0]
    ? getFileUrl(req.files.aadhaarCard[0])  // From file upload
    : aadhaarUrl;  // From JSON

  const profilePhoto = req.files?.profilePhoto?.[0]
    ? getFileUrl(req.files.profilePhoto[0])  // From file upload
    : photoUrl;  // From JSON

  // ... rest of code
});
```

---

## Postman Testing

### JSON Format (New Implementation)

**Method:** POST  
**URL:** `https://sharmik-backend-26c3.vercel.app/api/job-seekers/register/step1`  
**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "phone": "9876543210",
  "aadhaarCard": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/aadhaar/abc123.jpg",
  "profilePhoto": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/profile/xyz789.jpg"
}
```

### Form-Data Format (Current Implementation)

**Method:** POST  
**URL:** `https://sharmik-backend-26c3.vercel.app/api/job-seekers/register/step1`  
**Body Type:** `form-data`

**Fields:**
- `phone`: `9876543210` (text)
- `aadhaarCard`: [Select File] (file)
- `profilePhoto`: [Select File] (file)

---

## Pros and Cons

### JSON with URLs (New Approach)

**Pros:**
- ✅ Simpler API (no multipart/form-data)
- ✅ Works well with mobile apps (upload files separately)
- ✅ Better for microservices (files uploaded to CDN first)
- ✅ Easier to test in Postman
- ✅ Can cache/pre-process files before sending

**Cons:**
- ❌ Requires separate file upload endpoint
- ❌ Client must handle file uploads separately
- ❌ Two-step process (upload files, then send URLs)
- ❌ Need to validate URL accessibility

### Form-Data with Files (Current Approach)

**Pros:**
- ✅ Single request (files + data together)
- ✅ Server handles file uploads automatically
- ✅ Better for web forms
- ✅ Built-in file validation

**Cons:**
- ❌ Requires multipart/form-data
- ❌ More complex for mobile apps
- ❌ Harder to test in Postman
- ❌ Larger request payloads

---

## Recommendation

**Use JSON with URLs if:**
- You have a separate file upload service
- Mobile apps need more control over uploads
- You want to pre-process files before registration
- You need better API testability

**Use Form-Data if:**
- You want single-request simplicity
- Web forms are your primary interface
- Server-side file handling is preferred
- You want built-in file validation

**Use Hybrid Approach if:**
- You need to support both web and mobile clients
- You want maximum flexibility

---

## Example: Separate File Upload Endpoint

If you implement JSON URLs, you might want a separate endpoint for file uploads:

```javascript
// New route: POST /api/job-seekers/upload-file
router.post(
  "/upload-file",
  uploadSingle("file"),  // Single file upload
  uploadToCloudinaryMiddleware,
  (req, res) => {
    const fileUrl = getFileUrl(req.file);
    return res.json(
      ApiResponse.success(
        { fileUrl },
        "File uploaded successfully"
      )
    );
  }
);
```

**Client Flow:**
1. Upload files to `/upload-file` endpoint
2. Get URLs from response
3. Send URLs to `/register/step1` endpoint








