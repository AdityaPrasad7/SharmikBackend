# Flutter File Upload Fix - Step 1 Registration

## Problem

Flutter is sending **file paths as strings** instead of actual file data:
```
📎 aadhaarCard → /data/user/0/com.example.shramik/cache/file_picker/1763355797246/IMG-20251116-WA0003.jpg
📎 profilePhoto → /data/user/0/com.example.shramik/cache/file_picker/1763355803531/IMG20251104105327.jpg
```

**Result:** 500 Internal Server Error because:
1. Multer expects binary file data, not file paths
2. `req.files` is empty or undefined
3. `uploadToCloudinaryMiddleware` tries to access `file.buffer` which doesn't exist
4. Error occurs and gets caught by global error handler

---

## Solution 1: Fix Flutter Code (RECOMMENDED)

### Current Flutter Code (WRONG)
```dart
// ❌ WRONG - Sending file paths as strings
final request = http.MultipartRequest(
  'POST',
  Uri.parse('https://sharmik-backend-26c3.vercel.app/api/job-seekers/register/step1'),
);

request.fields['phone'] = '9686648194';
request.fields['category'] = 'Diploma Holder';

// ❌ This sends the path as a string, not the file
request.fields['aadhaarCard'] = aadhaarCardPath;
request.fields['profilePhoto'] = profilePhotoPath;
```

### Correct Flutter Code (RIGHT)
```dart
import 'package:http/http.dart' as http;
import 'dart:io';

Future<void> registerStep1() async {
  try {
    // Create multipart request
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('https://sharmik-backend-26c3.vercel.app/api/job-seekers/register/step1'),
    );

    // Add text fields
    request.fields['phone'] = '9686648194';
    request.fields['category'] = 'Diploma Holder';

    // ✅ CORRECT - Add actual file data
    // Read file and add as multipart file
    final aadhaarFile = File(aadhaarCardPath);
    final profileFile = File(profilePhotoPath);

    // Check if files exist
    if (!await aadhaarFile.exists()) {
      throw Exception('Aadhaar card file not found');
    }
    if (!await profileFile.exists()) {
      throw Exception('Profile photo file not found');
    }

    // Add files to multipart request
    request.files.add(
      await http.MultipartFile.fromPath(
        'aadhaarCard',  // Field name must match backend
        aadhaarFile.path,
        filename: aadhaarFile.path.split('/').last, // Optional: filename
      ),
    );

    request.files.add(
      await http.MultipartFile.fromPath(
        'profilePhoto',  // Field name must match backend
        profileFile.path,
        filename: profileFile.path.split('/').last, // Optional: filename
      ),
    );

    // Send request
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      print('✅ Success: ${response.body}');
    } else {
      print('❌ Error: ${response.statusCode} - ${response.body}');
    }
  } catch (e) {
    print('❌ Exception: $e');
  }
}
```

### Using image_picker Package
```dart
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'dart:io';

Future<void> registerStep1() async {
  try {
    // Pick images (example)
    final ImagePicker picker = ImagePicker();
    final XFile? aadhaarImage = await picker.pickImage(source: ImageSource.gallery);
    final XFile? profileImage = await picker.pickImage(source: ImageSource.camera);

    if (aadhaarImage == null || profileImage == null) {
      throw Exception('Please select both images');
    }

    // Create multipart request
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('https://sharmik-backend-26c3.vercel.app/api/job-seekers/register/step1'),
    );

    request.fields['phone'] = '9686648194';
    request.fields['category'] = 'Diploma Holder';

    // ✅ Add files from XFile
    request.files.add(
      await http.MultipartFile.fromPath(
        'aadhaarCard',
        aadhaarImage.path,
      ),
    );

    request.files.add(
      await http.MultipartFile.fromPath(
        'profilePhoto',
        profileImage.path,
      ),
    );

    // Send request
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    print('Response: ${response.statusCode} - ${response.body}');
  } catch (e) {
    print('Error: $e');
  }
}
```

### Using dio Package (Alternative)
```dart
import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';

Future<void> registerStep1() async {
  try {
    final dio = Dio();
    
    // Pick images
    final ImagePicker picker = ImagePicker();
    final XFile? aadhaarImage = await picker.pickImage(source: ImageSource.gallery);
    final XFile? profileImage = await picker.pickImage(source: ImageSource.camera);

    if (aadhaarImage == null || profileImage == null) {
      throw Exception('Please select both images');
    }

    // Create FormData
    final formData = FormData.fromMap({
      'phone': '9686648194',
      'category': 'Diploma Holder',
      'aadhaarCard': await MultipartFile.fromFile(
        aadhaarImage.path,
        filename: aadhaarImage.name,
      ),
      'profilePhoto': await MultipartFile.fromFile(
        profileImage.path,
        filename: profileImage.name,
      ),
    });

    // Send request
    final response = await dio.post(
      'https://sharmik-backend-26c3.vercel.app/api/job-seekers/register/step1',
      data: formData,
    );

    print('✅ Success: ${response.data}');
  } catch (e) {
    print('❌ Error: $e');
    if (e is DioException) {
      print('Response: ${e.response?.data}');
    }
  }
}
```

---

## Solution 2: Improve Backend Error Handling

Add better error logging to see actual errors:

**File:** `shramikBackend/app.js`

```javascript
// -------------------- Global Error Handler --------------------
app.use((err, req, res, next) => {
  // ✅ Log full error details for debugging
  console.error('❌ Error Details:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
    body: req.body,
    files: req.files,
  });

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
      meta: err.meta || null,
    });
  }

  // ✅ Return more details in development
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    data: isDevelopment ? {
      error: err.message,
      stack: err.stack,
    } : null,
    meta: null,
  });
});
```

---

## Solution 3: Add Validation in Upload Middleware

Add better error messages when files are missing:

**File:** `shramikBackend/src/middlewares/fileUpload.js`

```javascript
export const uploadToCloudinaryMiddleware = async (req, res, next) => {
  try {
    // ✅ Add validation for file uploads
    if (!req.file && !req.files) {
      console.warn('⚠️ No files received in request');
      console.warn('Request body:', req.body);
      console.warn('Request files:', req.files);
    }

    // Handle single file
    if (req.file) {
      // ✅ Validate file has buffer
      if (!req.file.buffer) {
        throw new Error(`File ${req.file.fieldname} has no buffer. Make sure you're sending actual file data, not file paths.`);
      }

      const folder = FIELD_TO_FOLDER[req.file.fieldname] || "documents";
      const resourceType = getResourceType(req.file.mimetype);
      
      const result = await uploadToCloudinary(
        req.file.buffer,
        folder,
        resourceType
      );
      
      req.file.cloudinaryUrl = result.secure_url;
      req.file.publicId = result.public_id;
      req.file.url = result.secure_url;
    }
    
    // Handle multiple files
    if (req.files) {
      for (const fieldname in req.files) {
        const files = Array.isArray(req.files[fieldname])
          ? req.files[fieldname]
          : [req.files[fieldname]];
        
        for (const file of files) {
          // ✅ Validate file has buffer
          if (!file.buffer) {
            throw new Error(`File ${fieldname} has no buffer. Make sure you're sending actual file data, not file paths.`);
          }

          const folder = FIELD_TO_FOLDER[fieldname] || "documents";
          const resourceType = getResourceType(file.mimetype);
          
          const result = await uploadToCloudinary(
            file.buffer,
            folder,
            resourceType
          );
          
          file.cloudinaryUrl = result.secure_url;
          file.publicId = result.public_id;
          file.url = result.secure_url;
        }
      }
    }
    
    next();
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    next(error);
  }
};
```

---

## Solution 4: Hybrid Approach (Accept Both Files and URLs)

If you want to support both file uploads and URLs, modify the route:

**File:** `shramikBackend/src/routes/jobSeeker/jobSeeker.routes.js`

```javascript
// Option 1: Make multer optional
router.post(
  "/register/step1",
  uploadFields([
    { name: "aadhaarCard", maxCount: 1 },
    { name: "profilePhoto", maxCount: 1 },
  ]).optional(),  // ✅ Make optional
  uploadToCloudinaryMiddleware,
  validateRequest(step1RegistrationSchema),
  step1Registration
);
```

**File:** `shramikBackend/src/validation/jobSeeker/jobSeeker.validation.js`

```javascript
const urlSchema = Joi.string()
  .uri({ scheme: ['http', 'https'] })
  .optional();

export const step1RegistrationSchema = Joi.object({
  phone: phoneSchema,
  // Accept either files (via multer) OR URLs (via JSON)
  aadhaarCard: urlSchema,
  profilePhoto: urlSchema,
});
```

**File:** `shramikBackend/src/controllers/jobSeeker/jobSeeker.controller.js`

```javascript
export const step1Registration = asyncHandler(async (req, res) => {
  const { phone, aadhaarCard: aadhaarUrl, profilePhoto: photoUrl } = req.body;

  // ✅ Get URLs from either file upload OR JSON body
  const aadhaarCard = req.files?.aadhaarCard?.[0]
    ? getFileUrl(req.files.aadhaarCard[0])  // From file upload
    : aadhaarUrl;  // From JSON body

  const profilePhoto = req.files?.profilePhoto?.[0]
    ? getFileUrl(req.files.profilePhoto[0])  // From file upload
    : photoUrl;  // From JSON body

  if (!aadhaarCard) {
    throw new ApiError(400, "Aadhaar card is required (either as file upload or URL)");
  }

  if (!profilePhoto) {
    throw new ApiError(400, "Profile photo is required (either as file upload or URL)");
  }

  // ... rest of code
});
```

---

## Testing in Postman

### Test 1: File Upload (Should Work)
- **Method:** POST
- **Body Type:** `form-data`
- **Fields:**
  - `phone`: `9686648194` (text)
  - `category`: `Diploma Holder` (text)
  - `aadhaarCard`: [Select File] (file)
  - `profilePhoto`: [Select File] (file)

### Test 2: JSON with URLs (If Hybrid Implemented)
- **Method:** POST
- **Body Type:** `raw` → `JSON`
- **Body:**
```json
{
  "phone": "9686648194",
  "category": "Diploma Holder",
  "aadhaarCard": "https://res.cloudinary.com/.../aadhaar.jpg",
  "profilePhoto": "https://res.cloudinary.com/.../profile.jpg"
}
```

---

## Recommended Solution

**✅ Use Solution 1** - Fix Flutter code to send actual file data. This is the proper way to handle file uploads and matches the backend's current implementation.

**Why?**
- Backend is already set up for file uploads
- No backend changes needed
- Standard HTTP multipart file upload
- Works with all HTTP clients

**If you need URLs instead:**
- Use Solution 4 (Hybrid Approach) to support both
- Or implement the JSON URL approach from `JSON_URL_IMPLEMENTATION_GUIDE.md`

---

## Debugging Checklist

1. ✅ Check Flutter is using `MultipartFile.fromPath()` not `fields[]`
2. ✅ Verify file paths exist before sending
3. ✅ Check field names match backend (`aadhaarCard`, `profilePhoto`)
4. ✅ Enable backend error logging to see actual errors
5. ✅ Test with Postman first to verify backend works
6. ✅ Check network request in Flutter DevTools

---

## Common Flutter Mistakes

❌ **Wrong:**
```dart
request.fields['aadhaarCard'] = filePath;  // Sends path as string
```

✅ **Right:**
```dart
request.files.add(await http.MultipartFile.fromPath('aadhaarCard', filePath));
```

❌ **Wrong:**
```dart
request.fields['aadhaarCard'] = File(filePath).readAsStringSync();  // Sends file content as text
```

✅ **Right:**
```dart
request.files.add(await http.MultipartFile.fromPath('aadhaarCard', filePath));
```








