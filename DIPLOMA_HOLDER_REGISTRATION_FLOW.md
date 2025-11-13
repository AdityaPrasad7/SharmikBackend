# Diploma Holder Registration Flow - Complete Guide

## 📋 Overview

Diploma Holder registration is a **multi-step process** (3 steps) that requires:
1. Phone OTP verification
2. Step 1: Upload Aadhaar Card & Profile Photo
3. Step 2: Select Trade/Specialization, Skills, and Answer Questions
4. Step 3: Education Details, Experience Status, and Document Uploads

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 0: Role Selection                                      │
│ GET /api/roles                                              │
│ → User selects "Job Seeker"                                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Category Selection                                  │
│ GET /api/job-seekers/categories                             │
│ → User selects "Diploma Holder"                            │
│ → localStorage.setItem('selectedCategory', 'Diploma Holder')│
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Phone Number Verification                           │
│                                                              │
│ 2a. Send OTP                                                │
│ POST /api/job-seekers/send-otp                             │
│ Body: { phone, category: "Diploma Holder" }               │
│ → Returns: { otp: "1234", isExistingUser: false }         │
│                                                              │
│ 2b. Verify OTP                                              │
│ POST /api/job-seekers/verify-otp                           │
│ Body: { phone, otp, category: "Diploma Holder" }           │
│ → Creates JobSeeker: { category: "Diploma Holder" }        │
│ → Returns: { jobSeeker: { _id, category, ... } }           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Registration Step 1 - Upload Documents               │
│ POST /api/job-seekers/register/step1                       │
│ Form-Data: phone, aadhaarCard (file), profilePhoto (file)  │
│ → Updates: aadhaarCard, profilePhoto, registrationStep: 2  │
│ → Returns: { jobSeeker: { _id, registrationStep: 2 } }     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: Get Specializations (for Step 2)                   │
│ GET /api/job-seekers/specializations                        │
│ → Returns: List of all specializations for dropdown        │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Get Skills & Questions (when specialization selected)│
│ GET /api/job-seekers/specialization/:specializationId      │
│ → Returns: Skills and Questions for that specialization    │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Registration Step 2 - Select Trade, Skills, Questions│
│ POST /api/job-seekers/register/step2                       │
│ Body: { jobSeekerId, specializationId, selectedSkills[],    │
│        questionAnswers[], role }                            │
│ → Updates: specializationId, selectedSkills,               │
│            questionAnswers, role, registrationStep: 3       │
│ → Returns: { jobSeeker: { registrationStep: 3 } }          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 7: Registration Step 3 - Education & Experience       │
│ POST /api/job-seekers/register/step3                       │
│ Form-Data: jobSeekerId, education (JSON),                  │
│            experienceStatus (JSON), resume (file),         │
│            experienceCertificate (file, conditional),      │
│            documents[] (files, optional)                   │
│ → Updates: education, experienceStatus, resume,            │
│            experienceCertificate, documents,                │
│            registrationStep: 4, isRegistrationComplete: true│
│ → Returns: { jobSeeker: { isRegistrationComplete: true } } │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Step-by-Step API Details

### **STEP 0: Role Selection**

**API:** `GET /api/roles`

**Response:**
```json
{
  "success": true,
  "data": {
    "roles": [
      {
        "id": "job-seeker",
        "label": "Job Seeker",
        "description": "Find your next career opportunity..."
      }
    ]
  }
}
```

**Action:** User selects "Job Seeker" → Navigate to category selection

---

### **STEP 1: Category Selection**

**API:** `GET /api/job-seekers/categories`

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "value": "Diploma Holder",
        "label": "Diploma Holder",
        "description": "Technical education diploma certified"
      }
    ]
  }
}
```

**Action:** 
- User clicks "Diploma Holder" card
- Frontend stores: `localStorage.setItem('selectedCategory', 'Diploma Holder')`
- Navigate to phone verification

---

### **STEP 2: Phone Number Verification**

#### **2a. Send OTP**

**API:** `POST /api/job-seekers/send-otp`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "phone": "9876543210",
  "category": "Diploma Holder"
}
```

**Note:** Category is automatically fetched from localStorage:
```javascript
const category = localStorage.getItem('selectedCategory'); // "Diploma Holder"
```

**Response:**
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

---

#### **2b. Verify OTP**

**API:** `POST /api/job-seekers/verify-otp`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "phone": "9876543210",
  "otp": "1234",
  "category": "Diploma Holder"
}
```

**Note:** Category is automatically fetched from localStorage

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
      "registrationStep": 1
    }
  }
}
```

**Important:** 
- Save `jobSeeker._id` to localStorage: `localStorage.setItem('jobSeekerId', jobSeeker._id)`
- Category is now saved in database ✅

---

### **STEP 3: Registration Step 1 - Upload Documents**

**API:** `POST /api/job-seekers/register/step1`

**Headers:** 
- **DO NOT** set `Content-Type` manually (Postman will set it automatically for form-data)

**Body:** Select `form-data` tab in Postman

| Key | Type | Value |
|-----|------|-------|
| `phone` | Text | `9876543210` |
| `aadhaarCard` | File | Select a file (image/PDF) |
| `profilePhoto` | File | Select a file (image) |

**Response:**
```json
{
  "success": true,
  "message": "Step 1 completed successfully",
  "data": {
    "jobSeeker": {
      "_id": "691419c003324c06bcdde7f9",
      "aadhaarCard": "https://res.cloudinary.com/...",
      "profilePhoto": "https://res.cloudinary.com/...",
      "registrationStep": 2
    }
  }
}
```

**Important:** 
- Save `jobSeeker._id` if not already saved
- `registrationStep` becomes `2` (ready for Step 2)

---

### **STEP 4: Get Specializations (for Step 2)**

**API:** `GET /api/job-seekers/specializations`

**Response:**
```json
{
  "success": true,
  "data": {
    "specializations": [
      {
        "_id": "691419c003324c06bcdde7f9",
        "value": "691419c003324c06bcdde7f9",
        "label": "Electrical",
        "name": "Electrical"
      },
      {
        "_id": "691419c003324c06bcdde7a1",
        "value": "691419c003324c06bcdde7a1",
        "label": "Plumbing",
        "name": "Plumbing"
      }
    ]
  }
}
```

**Action:** Populate dropdown with specializations

---

### **STEP 5: Get Skills & Questions (when specialization selected)**

**API:** `GET /api/job-seekers/specialization/:specializationId`

**Example:** `GET /api/job-seekers/specialization/691419c003324c06bcdde7f9`

**Response:**
```json
{
  "success": true,
  "data": {
    "specialization": {
      "_id": "691419c003324c06bcdde7f9",
      "name": "Electrical",
      "skills": ["Electrical", "Plumbing", "Carpentry"],
      "allSkills": [
        { "value": "Electrical", "label": "Electrical" },
        { "value": "Plumbing", "label": "Plumbing" },
        { "value": "Carpentry", "label": "Carpentry" }
      ]
    },
    "questionSet": {
      "_id": "...",
      "name": "Electrical Questions",
      "questions": [
        {
          "text": "What is the primary function of a circuit breaker?",
          "options": [
            { "text": "To regulate voltage", "isCorrect": false },
            { "text": "To interrupt current during overload", "isCorrect": true },
            { "text": "To store electrical energy", "isCorrect": false },
            { "text": "To increase current flow", "isCorrect": false }
          ]
        },
        {
          "text": "Which professional is primarily responsible for overseeing construction projects?",
          "options": [
            { "text": "Project Manager", "isCorrect": true },
            { "text": "Electrician", "isCorrect": false }
          ]
        }
      ],
      "totalQuestions": 2
    }
  }
}
```

**Action:** 
- Show skills for user to select (from `allSkills`)
- Show questions for user to answer (from `questionSet.questions`)

---

### **STEP 6: Registration Step 2 - Select Trade, Skills & Answer Questions**

**API:** `POST /api/job-seekers/register/step2`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "jobSeekerId": "691419c003324c06bcdde7f9",
  "specializationId": "691419c003324c06bcdde7f9",
  "selectedSkills": [
    "Electrical",
    "Plumbing"
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

**Important Notes:**
- `jobSeekerId` is preferred (from Step 1 response), or use `phone`
- `selectedSkills` must be skills from the selected specialization
- `questionAnswers` must answer ALL questions from the question set
- `role` is optional (defaults to "Worker")

**Response:**
```json
{
  "success": true,
  "message": "Step 2 completed successfully",
  "data": {
    "jobSeeker": {
      "_id": "691419c003324c06bcdde7f9",
      "specializationId": "691419c003324c06bcdde7f9",
      "selectedSkills": ["Electrical", "Plumbing"],
      "questionAnswers": [
        {
          "questionId": "q1",
          "questionText": "What is the primary function of a circuit breaker?",
          "selectedOption": "To interrupt current during overload",
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

### **STEP 7: Registration Step 3 - Education & Experience**

**API:** `POST /api/job-seekers/register/step3`

**Headers:** 
- **DO NOT** set `Content-Type` manually (Postman will set it automatically for form-data)

**Body:** Select `form-data` tab in Postman

#### **Option A: Fresher (No Experience)**

| Key | Type | Value |
|-----|------|-------|
| `jobSeekerId` | Text | `691419c003324c06bcdde7f9` |
| `education` | Text | `{"collegeInstituteName":"ABC College","city":"Mumbai","state":"Maharashtra","yearOfPassing":"2023","percentageOrGrade":"85%"}` |
| `experienceStatus` | Text | `{"hasExperience":false,"isFresher":true}` |
| `resume` | File | Select a PDF/file |
| `documents` | File | Select files (optional, max 5) |

#### **Option B: With Experience**

| Key | Type | Value |
|-----|------|-------|
| `jobSeekerId` | Text | `691419c003324c06bcdde7f9` |
| `education` | Text | `{"collegeInstituteName":"ABC College","city":"Mumbai","state":"Maharashtra","yearOfPassing":"2023","percentageOrGrade":"85%"}` |
| `experienceStatus` | Text | `{"hasExperience":true,"isFresher":false}` |
| `resume` | File | Select a PDF/file |
| `experienceCertificate` | File | Select a PDF/file (required if hasExperience: true) |
| `documents` | File | Select files (optional, max 5) |

**Important Notes:**
- `jobSeekerId` is preferred (from previous steps), or use `phone`
- `education` and `experienceStatus` must be sent as **JSON strings** (not objects)
- `resume` is **required**
- `experienceCertificate` is **required** if `hasExperience: true`
- `documents` is optional (can upload multiple files, max 5)

**Response:**
```json
{
  "success": true,
  "message": "Registration completed successfully",
  "data": {
    "jobSeeker": {
      "_id": "691419c003324c06bcdde7f9",
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
      "resume": "https://res.cloudinary.com/...",
      "registrationStep": 4,
      "isRegistrationComplete": true,
      "status": "Pending"
    }
  }
}
```

---

## 📋 Complete JSON Examples for Postman

### **Step 2: Select Trade, Skills & Questions**

```json
POST /api/job-seekers/register/step2
Content-Type: application/json

{
  "jobSeekerId": "691419c003324c06bcdde7f9",
  "specializationId": "691419c003324c06bcdde7f9",
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
  ]
}
```

### **Step 3: Education & Experience (Fresher)**

```
POST /api/job-seekers/register/step3
Content-Type: multipart/form-data

Form-Data:
  jobSeekerId: 691419c003324c06bcdde7f9
  education: {"collegeInstituteName":"ABC College","city":"Mumbai","state":"Maharashtra","yearOfPassing":"2023","percentageOrGrade":"85%"}
  experienceStatus: {"hasExperience":false,"isFresher":true}
  resume: [FILE]
  documents: [FILE] (optional)
```

### **Step 3: Education & Experience (With Experience)**

```
POST /api/job-seekers/register/step3
Content-Type: multipart/form-data

Form-Data:
  jobSeekerId: 691419c003324c06bcdde7f9
  education: {"collegeInstituteName":"ABC College","city":"Mumbai","state":"Maharashtra","yearOfPassing":"2023","percentageOrGrade":"85%"}
  experienceStatus: {"hasExperience":true,"isFresher":false}
  resume: [FILE]
  experienceCertificate: [FILE] (required)
  documents: [FILE] (optional)
```

---

## 🔑 Key Differences: Diploma vs Non-Degree

| Feature | Non-Degree Holder | Diploma Holder |
|---------|-------------------|----------------|
| **Registration Steps** | 1 step | 3 steps |
| **Questions** | ❌ No questions | ✅ Must answer all questions |
| **Education Details** | ❌ Not required | ✅ Required (Step 3) |
| **Experience Details** | ❌ Not required | ✅ Required (Step 3) |
| **Resume** | ❌ Not required | ✅ Required (Step 3) |
| **Experience Certificate** | ❌ Not required | ✅ Required if has experience |
| **Endpoint** | `/register/non-degree` | `/register/step1`, `/register/step2`, `/register/step3` |

---

## 📱 Frontend Flow Example

```javascript
// ============================================
// STEP 1: Category Selection
// ============================================
const categories = await fetch('/api/job-seekers/categories').then(r => r.json());
// User clicks "Diploma Holder"
localStorage.setItem('selectedCategory', 'Diploma Holder');

// ============================================
// STEP 2: Phone Verification
// ============================================
const category = localStorage.getItem('selectedCategory'); // "Diploma Holder"

// Send OTP
const sendOTPResponse = await fetch('/api/job-seekers/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: "9876543210",
    category: category // Auto-filled
  })
});

// Verify OTP
const verifyOTPResponse = await fetch('/api/job-seekers/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: "9876543210",
    otp: "1234",
    category: category // Auto-filled - SAVED TO DATABASE
  })
});

const { jobSeeker } = verifyOTPResponse.data;
localStorage.setItem('jobSeekerId', jobSeeker._id);

// ============================================
// STEP 3: Registration Step 1
// ============================================
const jobSeekerId = localStorage.getItem('jobSeekerId');

const formData = new FormData();
formData.append('phone', '9876543210');
formData.append('aadhaarCard', aadhaarFile);
formData.append('profilePhoto', profileFile);

const step1Response = await fetch('/api/job-seekers/register/step1', {
  method: 'POST',
  body: formData
});

// ============================================
// STEP 4: Get Specializations
// ============================================
const specializations = await fetch('/api/job-seekers/specializations').then(r => r.json());
// Show dropdown with specializations

// ============================================
// STEP 5: Get Skills & Questions
// ============================================
const specializationId = selectedSpecializationId;
const skillsData = await fetch(`/api/job-seekers/specialization/${specializationId}`).then(r => r.json());
// Show skills and questions to user

// ============================================
// STEP 6: Registration Step 2
// ============================================
const step2Data = {
  jobSeekerId: localStorage.getItem('jobSeekerId'),
  specializationId: specializationId,
  selectedSkills: selectedSkills, // From skillsData.specialization.allSkills
  questionAnswers: questionAnswers, // User's answers to all questions
  role: "Worker"
};

const step2Response = await fetch('/api/job-seekers/register/step2', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(step2Data)
});

// ============================================
// STEP 7: Registration Step 3
// ============================================
const formData3 = new FormData();
formData3.append('jobSeekerId', localStorage.getItem('jobSeekerId'));
formData3.append('education', JSON.stringify({
  collegeInstituteName: "ABC College",
  city: "Mumbai",
  state: "Maharashtra",
  yearOfPassing: "2023",
  percentageOrGrade: "85%"
}));
formData3.append('experienceStatus', JSON.stringify({
  hasExperience: false,
  isFresher: true
}));
formData3.append('resume', resumeFile);
if (hasExperience) {
  formData3.append('experienceCertificate', experienceCertFile);
}

const step3Response = await fetch('/api/job-seekers/register/step3', {
  method: 'POST',
  body: formData3
});

// ✅ Registration Complete!
```

---

## ✅ Summary

**Diploma Holder Registration Flow:**
1. ✅ Select Category → Store in localStorage
2. ✅ Verify Phone → Category saved to database
3. ✅ Step 1: Upload Aadhaar & Profile Photo
4. ✅ Step 2: Select Trade, Skills, Answer Questions
5. ✅ Step 3: Education, Experience, Documents
6. ✅ Registration Complete!

**Total Steps:** 3 registration steps (after phone verification)

