# Job Seeker Registration API Documentation

Base URL: `http://localhost:8000/api/job-seekers`

---

## 📱 1. OTP APIs

### 1.1 Send OTP
**Endpoint:** `POST /send-otp`  
**Description:** Send a 4-digit OTP to the mobile number for verification

**Request Body:**
```json
{
  "phone": "9876543210",
  "category": "Non-Degree Holder"
}
```

**Note:** `category` is **optional** in send-otp (since category is selected first in the UI flow). However, it's **required** in verify-otp.

**Valid Categories:**
- `"Non-Degree Holder"`
- `"Diploma Holder"`
- `"ITI Holder"`

**Alternative Request (without category):**
```json
{
  "phone": "9876543210"
}
```
*Category will be sent in verify-otp step*

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "otp": "1234"
  },
  "meta": null
}
```
*Note: OTP is only returned in development mode*

---

### 1.2 Verify OTP
**Endpoint:** `POST /verify-otp`  
**Description:** Verify the OTP sent to mobile number. **Category is REQUIRED here** as it's used to create/update the job seeker record.

**Request Body:**
```json
{
  "phone": "9876543210",
  "otp": "1234",
  "category": "Non-Degree Holder"
}
```

**Note:** Category must be provided in verify-otp even if it wasn't sent in send-otp.

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "jobSeeker": {
      "_id": "...",
      "phone": "9876543210",
      "phoneVerified": true,
      "category": "Non-Degree Holder",
      "registrationStep": 1,
      "createdAt": "...",
      "updatedAt": "..."
    }
  },
  "meta": null
}
```

---

## 🎓 2. Non-Degree Holder Registration

### 2.1 Complete Registration (Non-Degree Holder)
**Endpoint:** `POST /register/non-degree`  
**Description:** Complete registration for Non-Degree Holder in one step  
**Content-Type:** `multipart/form-data`

**Important:** Skills are fetched from the admin-created specialization. Admin must create a specialization (e.g., "Non-Degree") with skills, then users select from that specialization.

**Form Data:**
- `phone` (text): `"9876543210"`
- `state` (text): `"Maharashtra"`
- `city` (text): `"Mumbai"`
- `specializationId` (text): `"507f1f77bcf86cd799439011"` - ID of the specialization created by admin for Non-Degree
- `selectedSkills` (text): `["WordPress", "MS Office / Google Workspace", "Graphic Design"]`
  - *Note: Skills must belong to the selected specialization. Send as JSON string or array*
- `aadhaarCard` (file): Upload Aadhaar card file
- `profilePhoto` (file): Upload profile photo

**Request Body (JSON for reference):**
```json
{
  "phone": "9876543210",
  "state": "Maharashtra",
  "city": "Mumbai",
  "specializationId": "507f1f77bcf86cd799439011",
  "selectedSkills": [
    "WordPress",
    "MS Office / Google Workspace",
    "Graphic Design (Canva, Photoshop, Figma)",
    "Video Editing",
    "Content Writing"
  ]
}
```

**Flow:**
1. Admin creates a specialization (e.g., "Non-Degree") via admin panel
2. Admin adds skills to that specialization
3. User fetches specializations: `GET /specializations`
4. User selects the "Non-Degree" specialization
5. User gets skills: `GET /specialization/:specializationId` (to see available skills)
6. User selects skills from that specialization
7. User completes registration with selected specialization and skills

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Registration completed successfully",
  "data": {
    "jobSeeker": {
      "_id": "...",
      "phone": "9876543210",
      "phoneVerified": true,
      "category": "Non-Degree Holder",
      "state": "Maharashtra",
      "city": "Mumbai",
      "specializationId": "507f1f77bcf86cd799439011",
      "selectedSkills": ["WordPress", "MS Office / Google Workspace", "..."],
      "skills": ["WordPress", "MS Office / Google Workspace", "..."],
      "aadhaarCard": "uploads/aadhaar/...",
      "profilePhoto": "uploads/profile/...",
      "registrationStep": 4,
      "isRegistrationComplete": true,
      "status": "Pending"
    }
  },
  "meta": null
}
```

---

## 🎓 3. Diploma/ITI Holder Registration (Multi-Step)

### 3.1 Step 1: Upload Documents
**Endpoint:** `POST /register/step1`  
**Description:** Step 1 - Upload Aadhaar card and profile photo  
**Content-Type:** `multipart/form-data`

**Form Data:**
- `phone` (text): `"9876543210"`
- `category` (text): `"Diploma Holder"` or `"ITI Holder"`
- `aadhaarCard` (file): Upload Aadhaar card file
- `profilePhoto` (file): Upload profile photo

**Request Body (JSON for reference):**
```json
{
  "phone": "9876543210",
  "category": "Diploma Holder"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Step 1 completed successfully",
  "data": {
    "jobSeeker": {
      "_id": "...",
      "phone": "9876543210",
      "phoneVerified": true,
      "category": "Diploma Holder",
      "aadhaarCard": "uploads/aadhaar/...",
      "profilePhoto": "uploads/profile/...",
      "registrationStep": 2
    }
  },
  "meta": null
}
```

---

### 3.2 Step 2: Select Trade, Skills & Answer Questions
**Endpoint:** `POST /register/step2`  
**Description:** Step 2 - Select specialization (trade), skills, and answer skill questions

**Request Body:**
```json
{
  "phone": "9876543210",
  "specializationId": "507f1f77bcf86cd799439011",
  "selectedSkills": [
    "Electrical",
    "Plumbing",
    "Carpentry"
  ],
  "questionAnswers": [
    {
      "questionId": "q1",
      "questionText": "What is the primary function of a circuit breaker?",
      "selectedOption": "To interrupt current during overload"
    },
    {
      "questionId": "q2",
      "questionText": "Which professional is primarily responsible for overseeing construction projects?",
      "selectedOption": "Project Manager"
    }
  ],
  "role": "Worker"
}
```

**Valid Roles:**
- `"Worker"` (default)
- `"Contractor"`
- `"Admin"`

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Step 2 completed successfully",
  "data": {
    "jobSeeker": {
      "_id": "...",
      "phone": "9876543210",
      "specializationId": "...",
      "selectedSkills": ["Electrical", "Plumbing", "Carpentry"],
      "skills": ["Electrical", "Plumbing", "Carpentry"],
      "questionAnswers": [
        {
          "questionId": "q1",
          "questionText": "What is the primary function of a circuit breaker?",
          "selectedOption": "To interrupt current during overload",
          "isCorrect": true
        },
        {
          "questionId": "q2",
          "questionText": "Which professional is primarily responsible for overseeing construction projects?",
          "selectedOption": "Project Manager",
          "isCorrect": false
        }
      ],
      "role": "Worker",
      "registrationStep": 3
    }
  },
  "meta": null
}
```

---

### 3.3 Step 3: Education & Experience Details
**Endpoint:** `POST /register/step3`  
**Description:** Step 3 - Education details, experience status, and document uploads  
**Content-Type:** `multipart/form-data`

**Form Data:**
- `phone` (text): `"9876543210"`
- `education` (text): JSON string with education details
- `experienceStatus` (text): JSON string with experience status
- `resume` (file): Upload resume (required)
- `experienceCertificate` (file): Upload experience certificate (required if hasExperience is true)
- `documents` (file): Upload additional documents (optional, max 5)

**Request Body (JSON for reference):**
```json
{
  "phone": "9876543210",
  "education": {
    "collegeInstituteName": "Government Polytechnic, Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "yearOfPassing": "2023",
    "percentageOrGrade": "85%"
  },
  "experienceStatus": {
    "hasExperience": false,
    "isFresher": true
  }
}
```

**For Experienced Candidates:**
```json
{
  "phone": "9876543210",
  "education": {
    "collegeInstituteName": "Government Polytechnic, Mumbai",
    "city": "Mumbai",
    "state": "Maharashtra",
    "yearOfPassing": "2020",
    "percentageOrGrade": "82%"
  },
  "experienceStatus": {
    "hasExperience": true,
    "isFresher": false
  }
}
```
*Note: If `hasExperience: true`, `experienceCertificate` file is required*

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Registration completed successfully",
  "data": {
    "jobSeeker": {
      "_id": "...",
      "phone": "9876543210",
      "education": {
        "collegeInstituteName": "Government Polytechnic, Mumbai",
        "city": "Mumbai",
        "state": "Maharashtra",
        "yearOfPassing": "2023",
        "percentageOrGrade": "85%"
      },
      "experienceStatus": {
        "hasExperience": false,
        "isFresher": true
      },
      "resume": "uploads/resume/...",
      "documents": ["uploads/documents/..."],
      "registrationStep": 4,
      "isRegistrationComplete": true,
      "status": "Pending"
    }
  },
  "meta": null
}
```

---

## 📋 4. Get Categories

### 4.1 Get Available Categories
**Endpoint:** `GET /categories`  
**Description:** Get all active categories for registration (public endpoint, no auth required)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Categories fetched successfully",
  "data": {
    "categories": [
      {
        "value": "Diploma Holder",
        "label": "Diploma Holder",
        "description": "Technical education diploma certified"
      },
      {
        "value": "ITI Holder",
        "label": "ITI Holder",
        "description": "Industrial Training Institute qualified"
      },
      {
        "value": "Non-Degree Holder",
        "label": "Non-Degree Holder",
        "description": "Focus on practical skills & experience"
      }
    ]
  },
  "meta": null
}
```

---

## 📋 5. Get Specializations & Skills

### 5.1 Get All Specializations
**Endpoint:** `GET /specializations`  
**Description:** Get all active specializations (public endpoint, no auth required)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Specializations fetched successfully",
  "data": {
    "specializations": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Electrical",
        "skills": [
          "Electrical Wiring",
          "Circuit Breaker Installation",
          "Electrical Maintenance"
        ],
        "status": "Active"
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Plumbing",
        "skills": [
          "Pipe Installation",
          "Water Supply Systems",
          "Drainage Systems"
        ],
        "status": "Active"
      }
    ]
  },
  "meta": null
}
```

---

### 5.2 Get Specialization with Skills and Questions
**Endpoint:** `GET /specialization/:specializationId`  
**Description:** Get specialization details with skills and associated question set

**Example:** `GET /specialization/507f1f77bcf86cd799439011`

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Specialization and skills fetched successfully",
  "data": {
    "specialization": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Electrical",
      "skills": [
        "Electrical",
        "Plumbing",
        "Carpentry",
        "Welding",
        "Glasswork"
      ]
    },
    "questionSet": {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Electrical Question Set",
      "questions": [
        {
          "text": "What is the primary function of a circuit breaker?",
          "options": [
            {
              "text": "To regulate voltage",
              "isCorrect": false
            },
            {
              "text": "To interrupt current during overload",
              "isCorrect": true
            },
            {
              "text": "To store electrical energy",
              "isCorrect": false
            },
            {
              "text": "To increase current flow",
              "isCorrect": false
            }
          ]
        },
        {
          "text": "Which tool is commonly used to measure electrical current?",
          "options": [
            {
              "text": "Ammeter",
              "isCorrect": true
            },
            {
              "text": "Voltmeter",
              "isCorrect": false
            },
            {
              "text": "Wrench",
              "isCorrect": false
            },
            {
              "text": "Hammer",
              "isCorrect": false
            }
          ]
        }
      ],
      "totalQuestions": 2
    }
  },
  "meta": null
}
```

---

## 👤 6. Get Job Seeker Details

### 6.1 Get Job Seeker by Phone
**Endpoint:** `GET /phone/:phone`  
**Description:** Get job seeker registration details by phone number

**Example:** `GET /phone/9876543210`

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Job seeker fetched successfully",
  "data": {
    "jobSeeker": {
      "_id": "...",
      "phone": "9876543210",
      "phoneVerified": true,
      "category": "Diploma Holder",
      "state": "Maharashtra",
      "city": "Mumbai",
      "specializationId": {
        "_id": "...",
        "name": "Electrical",
        "skills": ["Electrical", "Plumbing"]
      },
      "selectedSkills": ["Electrical", "Plumbing"],
      "questionAnswers": [...],
      "aadhaarCard": "uploads/aadhaar/...",
      "profilePhoto": "uploads/profile/...",
      "resume": "uploads/resume/...",
      "education": {...},
      "experienceStatus": {...},
      "registrationStep": 4,
      "isRegistrationComplete": true,
      "status": "Pending",
      "createdAt": "...",
      "updatedAt": "..."
    }
  },
  "meta": null
}
```

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Phone number must be a valid 10-digit Indian mobile number",
  "data": null,
  "meta": null
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Specialization not found",
  "data": null,
  "meta": null
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Phone number already registered",
  "data": null,
  "meta": null
}
```

---

## 📝 Postman Testing Tips

### For File Uploads (multipart/form-data):
1. In Postman, select **Body** → **form-data**
2. For text fields, select **Text** and enter the value
3. For JSON fields (like `education`, `experienceStatus`, `skills`), select **Text** and enter as JSON string
4. For file fields, select **File** and choose your file

### Example Form-Data Setup:
```
Key: phone          | Type: Text      | Value: 9876543210
Key: state           | Type: Text      | Value: Maharashtra
Key: city            | Type: Text      | Value: Mumbai
Key: skills          | Type: Text     | Value: ["WordPress", "MS Office"]
Key: aadhaarCard     | Type: File      | Value: [Select File]
Key: profilePhoto    | Type: File      | Value: [Select File]
```

### For JSON Requests:
1. Select **Body** → **raw** → **JSON**
2. Copy and paste the JSON examples above
3. Make sure Content-Type header is set to `application/json`

---

## 🔄 Complete Registration Flow Examples

### Registration Flow (Matches UI Flow):

**Step 1: User selects category** (Frontend - no API call)
- User chooses: Non-Degree Holder / Diploma Holder / ITI Holder

**Step 2: Registration form opens** (Frontend - no API call)
- Form displays based on selected category

**Step 3: Get Categories (Optional)**
- `GET /categories` → Get available categories (if needed for dynamic UI)

**Step 4: Mobile verification**
- `POST /send-otp` → Get OTP (category optional, but can be sent)
- `POST /verify-otp` → Verify OTP (category REQUIRED - creates job seeker record)

**Step 5: Complete registration based on category:**

**Non-Degree Holder Flow:**
- `GET /specializations` → Get available specializations (find the "Non-Degree" specialization)
- `GET /specialization/:id` → Get skills for the selected specialization
- `POST /register/non-degree` → Complete registration with specialization and selected skills

**Diploma/ITI Holder Flow:**
- `GET /specializations` → Get available specializations
- `GET /specialization/:id` → Get skills and questions for selected specialization
- `POST /register/step1` → Upload Aadhaar & Profile Photo
- `POST /register/step2` → Select trade, skills, answer questions
- `POST /register/step3` → Education details, experience, upload resume

---

## 📌 Important Notes

1. **Phone Number Format:** Must be 10 digits starting with 6-9 (Indian mobile format)
2. **OTP Expiry:** OTP expires after 10 minutes
3. **File Size Limit:** Maximum 10MB per file
4. **Allowed File Types:** JPEG, JPG, PNG, GIF, PDF, DOC, DOCX
5. **Skills Validation:** Selected skills must belong to the chosen specialization
6. **All Questions Required:** All questions in the question set must be answered
7. **Experience Certificate:** Required only if `hasExperience: true` in step 3

---

## 🧪 Test Data Examples

### Test Phone Numbers:
- `9876543210`
- `9123456789`
- `8765432109`

### Test States:
- `Maharashtra`
- `Karnataka`
- `Delhi`
- `Gujarat`

### Test Cities:
- `Mumbai`
- `Pune`
- `Bangalore`
- `Delhi`

---

---

## 🔐 7. Admin Category Management APIs

**Base URL:** `http://localhost:8000/api/categories`  
**Auth:** All endpoints require JWT authentication (Bearer token)

### 7.1 Get All Categories (Admin)
**Endpoint:** `GET /api/categories`  
**Description:** Get all categories with optional status filter  
**Auth:** Required

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Query Parameters (optional):**
- `status`: Filter by status (`Active` or `Inactive`)

**Example:**
```
GET /api/categories
GET /api/categories?status=Active
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Categories fetched successfully",
  "data": {
    "categories": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "Diploma Holder",
        "description": "Technical education diploma certified",
        "status": "Active",
        "createdAt": "...",
        "updatedAt": "..."
      },
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "ITI Holder",
        "description": "Industrial Training Institute qualified",
        "status": "Active",
        "createdAt": "...",
        "updatedAt": "..."
      },
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Non-Degree Holder",
        "description": "Focus on practical skills & experience",
        "status": "Active",
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  },
  "meta": null
}
```

---

### 7.2 Get Category by ID (Admin)
**Endpoint:** `GET /api/categories/:id`  
**Description:** Get a specific category by ID  
**Auth:** Required

**Example:**
```
GET /api/categories/507f1f77bcf86cd799439011
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Category fetched successfully",
  "data": {
    "category": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Non-Degree Holder",
      "description": "Focus on practical skills & experience",
      "status": "Active",
      "createdBy": "...",
      "updatedBy": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  },
  "meta": null
}
```

---

### 7.3 Create Category (Admin)
**Endpoint:** `POST /api/categories`  
**Description:** Create a new category  
**Auth:** Required

**Request Body:**
```json
{
  "name": "Graduate Holder",
  "description": "Graduate degree holders",
  "status": "Active"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "category": {
      "_id": "507f1f77bcf86cd799439014",
      "name": "Graduate Holder",
      "description": "Graduate degree holders",
      "status": "Active",
      "createdBy": "...",
      "updatedBy": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  },
  "meta": null
}
```

**Error Response (409 - Conflict):**
```json
{
  "success": false,
  "message": "Category with this name already exists",
  "data": null,
  "meta": null
}
```

---

### 7.4 Update Category (Admin)
**Endpoint:** `PUT /api/categories/:id`  
**Description:** Update an existing category  
**Auth:** Required

**Request Body (all fields optional):**
```json
{
  "name": "Updated Category Name",
  "description": "Updated description",
  "status": "Inactive"
}
```

**Example:**
```
PUT /api/categories/507f1f77bcf86cd799439011
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "category": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Updated Category Name",
      "description": "Updated description",
      "status": "Inactive",
      "updatedBy": "...",
      "updatedAt": "..."
    }
  },
  "meta": null
}
```

**Error Response (409 - Conflict):**
```json
{
  "success": false,
  "message": "Another category with this name exists",
  "data": null,
  "meta": null
}
```

---

### 7.5 Delete Category (Admin)
**Endpoint:** `DELETE /api/categories/:id`  
**Description:** Delete a category  
**Auth:** Required

**Example:**
```
DELETE /api/categories/507f1f77bcf86cd799439011
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": null,
  "meta": null
}
```

**Error Response (404 - Not Found):**
```json
{
  "success": false,
  "message": "Category not found",
  "data": null,
  "meta": null
}
```

---

## 📌 Admin API Notes

1. **Authentication:** All admin category APIs require JWT token in the Authorization header
2. **Token Format:** `Authorization: Bearer <token>`
3. **Status Values:** Only `"Active"` or `"Inactive"` are allowed
4. **Name Uniqueness:** Category names must be unique
5. **Validation:** 
   - Name: 2-100 characters, required
   - Description: Max 500 characters, optional
   - Status: "Active" or "Inactive", defaults to "Active"

---

**Happy Testing! 🚀**

