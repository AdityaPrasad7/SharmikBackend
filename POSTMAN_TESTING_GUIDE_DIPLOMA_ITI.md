# Postman Testing Guide - Diploma/ITI Holder Registration

## 🚀 Base URL
```
http://localhost:8000
```

---

## 📋 Step-by-Step Testing Flow

### **STEP 0: Get Available Data (Optional - for reference)**

#### **1. Get Categories**
- **Method**: `GET`
- **URL**: `http://localhost:8000/api/job-seekers/categories`
- **Headers**: None required
- **Body**: None
- **Response Example**:
```json
{
  "success": true,
  "message": "Categories fetched successfully",
  "data": {
    "categories": [
      {
        "value": "Diploma Holder",
        "label": "Diploma Holder",
        "description": ""
      },
      {
        "value": "ITI Holder",
        "label": "ITI Holder",
        "description": ""
      }
    ]
  }
}
```

---

#### **2. Get All Specializations (for Step 2)**
- **Method**: `GET`
- **URL**: `http://localhost:8000/api/job-seekers/specializations`
- **Headers**: None required
- **Body**: None
- **Response Example**:
```json
{
  "success": true,
  "message": "Specializations fetched successfully",
  "data": {
    "specializations": [
      {
        "_id": "69146392f6255cc7b5068554",
        "name": "Diploma",
        "skills": ["Video Editing", "Basic Animation", "Content Writing"],
        "status": "Active"
      }
    ]
  }
}
```
**Note**: Save the `_id` from a specialization for Step 2.

---

#### **3. Get Specialization with Skills and Questions (for Step 2)**
- **Method**: `GET`
- **URL**: `http://localhost:8000/api/job-seekers/specialization/:specializationId`
- **Example**: `http://localhost:8000/api/job-seekers/specialization/69146392f6255cc7b5068554`
- **Headers**: None required
- **Body**: None
- **Response Example**:
```json
{
  "success": true,
  "message": "Specialization and skills fetched successfully",
  "data": {
    "specialization": {
      "_id": "69146392f6255cc7b5068554",
      "name": "Diploma",
      "skills": ["Video Editing", "Basic Animation", "Content Writing"]
    },
    "questionSet": {
      "_id": "...",
      "name": "Diploma Questions",
      "questions": [
        {
          "text": "What is video editing?",
          "options": [
            { "text": "Option A", "isCorrect": true },
            { "text": "Option B", "isCorrect": false }
          ]
        }
      ],
      "totalQuestions": 1
    }
  }
}
```
**Note**: Use this to get:
- Available skills for `selectedSkills` in Step 2
- Questions for `questionAnswers` in Step 2

---

### **STEP 1: Send OTP**

- **Method**: `POST`
- **URL**: `http://localhost:8000/api/job-seekers/send-otp`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
```json
{
  "phone": "9876543210",
  "category": "Diploma Holder"
}
```

**Response Example**:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "otp": "1234",
    "isExistingUser": false
  }
}
```

**Note**: 
- Phone must be 10 digits starting with 6-9
- Category: `"Diploma Holder"` or `"ITI Holder"`
- In development, OTP is always `"1234"`

---

### **STEP 2: Verify OTP**

- **Method**: `POST`
- **URL**: `http://localhost:8000/api/job-seekers/verify-otp`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
```json
{
  "phone": "9876543210",
  "otp": "1234",
  "category": "Diploma Holder"
}
```

**Response Example**:
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "jobSeeker": {
      "_id": "...",
      "phone": "9876543210",
      "phoneVerified": true,
      "category": "Diploma Holder",
      "registrationStep": 1,
      "isRegistrationComplete": false
    }
  }
}
```

**Note**: 
- OTP must be exactly 4 digits
- Category is required for new users
- After verification, `registrationStep` becomes `1`

---

### **STEP 3: Registration Step 1 - Upload Aadhaar & Profile Photo**

- **Method**: `POST`
- **URL**: `http://localhost:8000/api/job-seekers/register/step1`
- **Headers**: 
  - **DO NOT** set `Content-Type` manually (Postman will set it automatically for form-data)
- **Body**: Select `form-data` tab in Postman

| Key | Type | Value |
|-----|------|-------|
| `phone` | Text | `9876543210` |
| `aadhaarCard` | File | Select a file (image/PDF) |
| `profilePhoto` | File | Select a file (image) |

**Important Notes**:
- Use `form-data` (not `raw` JSON)
- `aadhaarCard` and `profilePhoto` must be selected as **File** type (not Text)
- `category` is NOT required - it's already set during OTP verification

**Response Example**:
```json
{
  "success": true,
  "message": "Step 1 completed successfully",
  "data": {
    "jobSeeker": {
      "_id": "...",
      "phone": "9876543210",
      "aadhaarCard": "/uploads/aadhaar/file-123.png",
      "profilePhoto": "/uploads/profile/file-456.jpg",
      "registrationStep": 2
    }
  }
}
```

---

### **STEP 4: Registration Step 2 - Select Trade, Skills & Answer Questions**

- **Method**: `POST`
- **URL**: `http://localhost:8000/api/job-seekers/register/step2`
- **Headers**:
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
```json
{
  "phone": "9876543210",
  "specializationId": "69146392f6255cc7b5068554",
  "selectedSkills": [
    "Video Editing",
    "Basic Animation",
    "Content Writing"
  ],
  "questionAnswers": [
    {
      "questionId": "q1",
      "questionText": "What is video editing?",
      "selectedOption": "Option A"
    },
    {
      "questionId": "q2",
      "questionText": "What is animation?",
      "selectedOption": "Option B"
    }
  ],
  "role": "Worker"
}
```

**Important Notes**:
- `specializationId`: Get this from Step 0.2 or Step 0.3
- `selectedSkills`: Must be skills that belong to the specialization (get from Step 0.3)
- `questionAnswers`: 
  - Must answer ALL questions from the question set
  - Get questions from Step 0.3
  - `isCorrect` is optional (backend will calculate it)
- `role`: Optional, defaults to `"Worker"` (options: `"Worker"`, `"Contractor"`, `"Admin"`)

**Response Example**:
```json
{
  "success": true,
  "message": "Step 2 completed successfully",
  "data": {
    "jobSeeker": {
      "_id": "...",
      "phone": "9876543210",
      "specializationId": "69146392f6255cc7b5068554",
      "selectedSkills": ["Video Editing", "Basic Animation", "Content Writing"],
      "questionAnswers": [
        {
          "questionId": "q1",
          "questionText": "What is video editing?",
          "selectedOption": "Option A",
          "isCorrect": true
        }
      ],
      "role": "Worker",
      "registrationStep": 3
    }
  }
}
```

---

### **STEP 5: Registration Step 3 - Education & Experience Details**

- **Method**: `POST`
- **URL**: `http://localhost:8000/api/job-seekers/register/step3`
- **Headers**: 
  - **DO NOT** set `Content-Type` manually (Postman will set it automatically for form-data)
- **Body**: Select `form-data` tab in Postman

#### **Option A: Fresher (No Experience)**

| Key | Type | Value |
|-----|------|-------|
| `phone` | Text | `9876543210` |
| `education` | Text | `{"collegeInstituteName":"ABC College","city":"Mumbai","state":"Maharashtra","yearOfPassing":"2023","percentageOrGrade":"85%"}` |
| `experienceStatus` | Text | `{"hasExperience":false,"isFresher":true}` |
| `resume` | File | Select a PDF/file |
| `documents` | File | Select files (optional, max 5) |

#### **Option B: With Experience**

| Key | Type | Value |
|-----|------|-------|
| `phone` | Text | `9876543210` |
| `education` | Text | `{"collegeInstituteName":"ABC College","city":"Mumbai","state":"Maharashtra","yearOfPassing":"2023","percentageOrGrade":"85%"}` |
| `experienceStatus` | Text | `{"hasExperience":true,"isFresher":false}` |
| `resume` | File | Select a PDF/file |
| `experienceCertificate` | File | Select a PDF/file (required if hasExperience: true) |
| `documents` | File | Select files (optional, max 5) |

**Important Notes**:
- `education` and `experienceStatus` must be sent as **JSON strings** (not objects)
- `resume` is **required**
- `experienceCertificate` is **required** if `hasExperience: true`
- `documents` is optional (can upload multiple files, max 5)

**Response Example**:
```json
{
  "success": true,
  "message": "Registration completed successfully",
  "data": {
    "jobSeeker": {
      "_id": "...",
      "phone": "9876543210",
      "education": {
        "collegeInstituteName": "ABC College",
        "city": "Mumbai",
        "state": "Maharashtra",
        "yearOfPassing": "2023",
        "percentageOrGrade": "85%"
      },
      "experienceStatus": {
        "hasExperience": false,
        "isFresher": true
      },
      "resume": "/uploads/resume/file-789.pdf",
      "registrationStep": 4,
      "isRegistrationComplete": true,
      "status": "Pending"
    }
  }
}
```

---

## 🔍 Verification Endpoints

### **Get Job Seeker by Phone**
- **Method**: `GET`
- **URL**: `http://localhost:8000/api/job-seekers/phone/:phone`
- **Example**: `http://localhost:8000/api/job-seekers/phone/9876543210`
- **Headers**: None required
- **Body**: None

**Response Example**:
```json
{
  "success": true,
  "message": "Job seeker fetched successfully",
  "data": {
    "jobSeeker": {
      "_id": "...",
      "phone": "9876543210",
      "category": "Diploma Holder",
      "registrationStep": 4,
      "isRegistrationComplete": true,
      "status": "Pending",
      "specializationId": {
        "_id": "69146392f6255cc7b5068554",
        "name": "Diploma",
        "skills": ["Video Editing", "Basic Animation"]
      }
    }
  }
}
```

---

## 📝 Complete Example Flow

### **1. Send OTP**
```json
POST http://localhost:8000/api/job-seekers/send-otp
{
  "phone": "9876543210",
  "category": "Diploma Holder"
}
```

### **2. Verify OTP**
```json
POST http://localhost:8000/api/job-seekers/verify-otp
{
  "phone": "9876543210",
  "otp": "1234",
  "category": "Diploma Holder"
}
```

### **3. Step 1 (Form-Data)**
```
POST http://localhost:8000/api/job-seekers/register/step1
Form-Data:
  phone: 9876543210
  aadhaarCard: [FILE]
  profilePhoto: [FILE]
```

### **4. Step 2 (JSON)**
```json
POST http://localhost:8000/api/job-seekers/register/step2
{
  "phone": "9876543210",
  "specializationId": "69146392f6255cc7b5068554",
  "selectedSkills": ["Video Editing", "Basic Animation"],
  "questionAnswers": [
    {
      "questionId": "q1",
      "questionText": "What is video editing?",
      "selectedOption": "Option A"
    }
  ],
  "role": "Worker"
}
```

### **5. Step 3 (Form-Data)**
```
POST http://localhost:8000/api/job-seekers/register/step3
Form-Data:
  phone: 9876543210
  education: {"collegeInstituteName":"ABC College","city":"Mumbai","state":"Maharashtra","yearOfPassing":"2023","percentageOrGrade":"85%"}
  experienceStatus: {"hasExperience":false,"isFresher":true}
  resume: [FILE]
  documents: [FILE] (optional)
```

---

## ⚠️ Common Errors & Solutions

### **Error: "Phone number is required"**
- **Cause**: Using `raw` JSON instead of `form-data` for file upload endpoints
- **Solution**: Use `form-data` tab for Step 1 and Step 3

### **Error: "selectedSkills must be an array"**
- **Cause**: Sending `selectedSkills` as a string in form-data
- **Solution**: Step 2 uses `raw` JSON, not form-data

### **Error: "Please complete step 1 first"**
- **Cause**: Trying to access Step 2 before completing Step 1
- **Solution**: Complete steps in order: Step 1 → Step 2 → Step 3

### **Error: "Invalid skills: [skill name]"**
- **Cause**: Selected skills don't belong to the specialization
- **Solution**: Get available skills from `/specialization/:specializationId` endpoint

### **Error: "Please answer all X questions"**
- **Cause**: Not answering all questions from the question set
- **Solution**: Get questions from `/specialization/:specializationId` and answer all of them

### **Error: "Experience certificate is required when you have experience"**
- **Cause**: Set `hasExperience: true` but didn't upload `experienceCertificate`
- **Solution**: Either set `hasExperience: false` or upload the certificate

---

## 🎯 Quick Testing Checklist

- [ ] Step 0: Get categories and specializations
- [ ] Step 1: Send OTP with valid phone
- [ ] Step 2: Verify OTP with correct code
- [ ] Step 3: Upload Step 1 files (aadhaarCard, profilePhoto)
- [ ] Step 4: Complete Step 2 with valid specialization, skills, and questions
- [ ] Step 5: Complete Step 3 with education and experience details
- [ ] Verify: Get job seeker by phone to confirm registration complete

---

## 📌 Important Reminders

1. **Phone Number**: Must be 10 digits, starting with 6-9
2. **OTP**: In development, always use `"1234"`
3. **File Uploads**: Use `form-data` (not `raw` JSON) for Step 1 and Step 3
4. **JSON Strings**: In form-data, `education` and `experienceStatus` must be JSON strings
5. **Step Order**: Must complete steps in order (1 → 2 → 3)
6. **Specialization ID**: Get from `/specializations` or `/specialization/:id` endpoint
7. **Skills & Questions**: Get from `/specialization/:id` endpoint

---

**Happy Testing! 🚀**

