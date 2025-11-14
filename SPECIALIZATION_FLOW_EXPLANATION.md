# Specialization Flow: From Admin to Job Seeker Registration

## 📋 Overview

This document explains **step-by-step** how specializations are created by admin and then fetched/used in job seeker registration.

---

## 🏗️ **PART 1: Database Structure**

### **1.1 Specialization Model** (`Specialization`)

**Location:** `src/models/admin/specialization/specialization.model.js`

**Schema Structure:**
```javascript
{
  name: String,           // e.g., "Electrical", "Plumbing", "MERN Stack"
  status: String,         // "Active" or "Inactive"
  skills: [String],       // Array of skills, e.g., ["Wiring", "Circuit Design"]
  createdBy: ObjectId,   // Admin user who created it
  updatedBy: ObjectId,    // Admin user who last updated it
  timestamps: true        // createdAt, updatedAt
}
```

**Example Document:**
```json
{
  "_id": "691419c003324c06bcdde7f9",
  "name": "Electrical",
  "status": "Active",
  "skills": ["Wiring", "Circuit Design", "Panel Installation"],
  "createdBy": "691419c003324c06bcdde7a1",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

---

### **1.2 Question Set Model** (`QuestionSet`)

**Location:** `src/models/admin/questionSet/questionSet.model.js`

**Schema Structure:**
```javascript
{
  name: String,                    // e.g., "Electrical Questions"
  specializationIds: [ObjectId],  // Array of specialization IDs this question set belongs to
  questions: [{
    text: String,                  // Question text
    options: [{
      text: String,                 // Option text
      isCorrect: Boolean           // Whether this option is correct
    }]
  }],
  totalQuestions: Number,          // Auto-calculated from questions.length
  createdBy: ObjectId,
  updatedBy: ObjectId,
  timestamps: true
}
```

**Example Document:**
```json
{
  "_id": "69141a1903324c06bcdde849",
  "name": "Electrical Questions",
  "specializationIds": ["691419c003324c06bcdde7f9"],  // Links to "Electrical" specialization
  "questions": [
    {
      "text": "What is the primary function of a circuit breaker?",
      "options": [
        { "text": "To interrupt current during overload", "isCorrect": true },
        { "text": "To increase voltage", "isCorrect": false }
      ]
    }
  ],
  "totalQuestions": 1
}
```

**Key Point:** A `QuestionSet` can be linked to **multiple specializations** via `specializationIds` array.

---

## 👨‍💼 **PART 2: Admin Creates Specialization**

### **2.1 Admin API Endpoint**

**Route:** `POST /api/admin/specializations`

**Controller:** `src/controllers/admin/specialization/specialization.controller.js`
- Function: `createSpecialization`

**Request Body:**
```json
{
  "name": "Electrical",
  "status": "Active",
  "skills": ["Wiring", "Circuit Design", "Panel Installation"]
}
```

**What Happens:**
1. ✅ Validates that `name` is provided and unique
2. ✅ Normalizes skills array (removes duplicates, trims whitespace)
3. ✅ Creates new `Specialization` document in MongoDB
4. ✅ Saves `createdBy` as the admin user's ID

**Response:**
```json
{
  "success": true,
  "message": "Specialization created successfully",
  "data": {
    "specialization": {
      "_id": "691419c003324c06bcdde7f9",
      "name": "Electrical",
      "status": "Active",
      "skills": ["Wiring", "Circuit Design", "Panel Installation"],
      "createdBy": "691419c003324c06bcdde7a1",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  }
}
```

**Database State After Creation:**
```
Specialization Collection:
┌─────────────────────────────────────────────────────────┐
│ _id: 691419c003324c06bcdde7f9                          │
│ name: "Electrical"                                      │
│ status: "Active"                                        │
│ skills: ["Wiring", "Circuit Design", "Panel Install"] │
│ createdBy: 691419c003324c06bcdde7a1                    │
└─────────────────────────────────────────────────────────┘
```

---

### **2.2 Admin Creates Question Set (Optional)**

**Route:** `POST /api/admin/question-sets` (if exists)

**What Happens:**
1. Admin creates a `QuestionSet` with questions
2. Links it to one or more specializations via `specializationIds` array

**Example:**
```json
{
  "name": "Electrical Questions",
  "specializationIds": ["691419c003324c06bcdde7f9"],  // Links to "Electrical"
  "questions": [
    {
      "text": "What is the primary function of a circuit breaker?",
      "options": [
        { "text": "To interrupt current during overload", "isCorrect": true },
        { "text": "To increase voltage", "isCorrect": false }
      ]
    }
  ]
}
```

**Database State:**
```
QuestionSet Collection:
┌─────────────────────────────────────────────────────────┐
│ _id: 69141a1903324c06bcdde849                           │
│ name: "Electrical Questions"                            │
│ specializationIds: [691419c003324c06bcdde7f9]          │
│ questions: [{ text: "...", options: [...] }]           │
└─────────────────────────────────────────────────────────┘
```

---

## 👤 **PART 3: Job Seeker Registration Flow**

### **3.1 Step 1: Job Seeker Opens Registration Form**

**What Happens:**
- Job seeker navigates to registration Step 2 (for Diploma/ITI holders)
- The form needs to show a **dropdown of available specializations**

---

### **3.2 Step 2: Fetch All Specializations (For Dropdown)**

**API Endpoint:** `GET /api/job-seekers/specializations`

**Route:** `src/routes/jobSeeker/jobSeeker.routes.js` (Line 98)
```javascript
router.get("/specializations", getAllSpecializations);
```

**Controller:** `src/controllers/jobSeeker/jobSeeker.controller.js`
- Function: `getAllSpecializations` (Lines 558-580)

**What the Controller Does:**

```javascript
export const getAllSpecializations = asyncHandler(async (req, res) => {
  // 1. Query MongoDB for ALL active specializations
  const specializations = await Specialization.find({ status: "Active" })
    .select("name skills status")  // Only get these fields
    .sort({ name: 1 })             // Sort alphabetically
    .lean();                        // Return plain JavaScript objects (faster)

  // 2. Format for frontend dropdown
  const formattedSpecializations = specializations.map((spec) => ({
    _id: spec._id,                  // MongoDB ID
    value: spec._id.toString(),    // String version of ID (for form values)
    label: spec.name,               // Display name (e.g., "Electrical")
    name: spec.name,                // Also include name
  }));

  // 3. Return formatted response
  return res.status(200).json(
    ApiResponse.success(
      { specializations: formattedSpecializations },
      "Specializations fetched successfully"
    )
  );
});
```

**Request:**
```http
GET /api/job-seekers/specializations
```

**Response:**
```json
{
  "success": true,
  "message": "Specializations fetched successfully",
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

**Frontend Action:**
- Populate dropdown with `specializations` array
- Display `label` (e.g., "Electrical") to user
- Store `value` (ID) when user selects

---

### **3.3 Step 3: User Selects a Specialization**

**What Happens:**
- User selects "Electrical" from dropdown
- Frontend now has: `specializationId = "691419c003324c06bcdde7f9"`
- Frontend needs to:
  1. Fetch **all skills** for this specialization (for user to select)
  2. Fetch **questions** related to this specialization (for user to answer)

---

### **3.4 Step 4: Fetch Skills & Questions for Selected Specialization**

**API Endpoint:** `GET /api/job-seekers/specialization/:specializationId`

**Route:** `src/routes/jobSeeker/jobSeeker.routes.js` (Line 100-105)
```javascript
router.get(
  "/specialization/:specializationId",
  validateRequest(getSpecializationSkillsSchema, "params"),
  getSpecializationSkills
);
```

**Controller:** `src/controllers/jobSeeker/jobSeeker.controller.js`
- Function: `getSpecializationSkills` (Lines 588-642)

**What the Controller Does:**

```javascript
export const getSpecializationSkills = asyncHandler(async (req, res) => {
  const { specializationId } = req.params;  // e.g., "691419c003324c06bcdde7f9"

  // 1. Find the specialization by ID
  const specialization = await Specialization.findById(specializationId).lean();
  if (!specialization) {
    throw new ApiError(404, "Specialization not found");
  }
  // specialization = {
  //   _id: "691419c003324c06bcdde7f9",
  //   name: "Electrical",
  //   skills: ["Wiring", "Circuit Design", "Panel Installation"],
  //   status: "Active"
  // }

  // 2. Find question set linked to this specialization
  const specializationObjectId = new mongoose.Types.ObjectId(specializationId);
  const questionSet = await QuestionSet.findOne({
    specializationIds: { $in: [specializationObjectId] }  // Check if specializationId is in array
  }).lean();
  // questionSet = {
  //   _id: "69141a1903324c06bcdde849",
  //   name: "Electrical Questions",
  //   specializationIds: ["691419c003324c06bcdde7f9"],
  //   questions: [
  //     {
  //       text: "What is the primary function of a circuit breaker?",
  //       options: [
  //         { text: "To interrupt current during overload", isCorrect: true },
  //         { text: "To increase voltage", isCorrect: false }
  //       ]
  //     }
  //   ]
  // }

  // 3. Format skills for frontend selection
  const allSkills = (specialization.skills || []).map((skill) => ({
    value: skill,  // e.g., "Wiring"
    label: skill,  // e.g., "Wiring"
  }));
  // allSkills = [
  //   { value: "Wiring", label: "Wiring" },
  //   { value: "Circuit Design", label: "Circuit Design" },
  //   { value: "Panel Installation", label: "Panel Installation" }
  // ]

  // 4. Format questions with auto-generated questionId
  const formattedQuestions = questionSet
    ? (questionSet.questions || []).map((question, index) => ({
        questionId: `q${index + 1}`,  // Auto-generated: "q1", "q2", "q3"
        text: question.text,
        options: question.options || [],
      }))
    : [];
  // formattedQuestions = [
  //   {
  //     questionId: "q1",
  //     text: "What is the primary function of a circuit breaker?",
  //     options: [
  //       { text: "To interrupt current during overload", isCorrect: true },
  //       { text: "To increase voltage", isCorrect: false }
  //     ]
  //   }
  // ]

  // 5. Return formatted response
  return res.status(200).json(
    ApiResponse.success(
      {
        specialization: {
          _id: specialization._id,
          name: specialization.name,
          skills: specialization.skills || [],      // Raw array: ["Wiring", "Circuit Design"]
          allSkills: allSkills,                    // Formatted: [{value, label}, ...]
        },
        questionSet: questionSet
          ? {
              _id: questionSet._id,
              name: questionSet.name,
              questions: formattedQuestions,        // Questions with auto-generated questionId
              totalQuestions: questionSet.totalQuestions || 0,
            }
          : null,
      },
      "Specialization, skills, and questions fetched successfully"
    )
  );
});
```

**Request:**
```http
GET /api/job-seekers/specialization/691419c003324c06bcdde7f9
```

**Response:**
```json
{
  "success": true,
  "message": "Specialization, skills, and questions fetched successfully",
  "data": {
    "specialization": {
      "_id": "691419c003324c06bcdde7f9",
      "name": "Electrical",
      "skills": ["Wiring", "Circuit Design", "Panel Installation"],
      "allSkills": [
        { "value": "Wiring", "label": "Wiring" },
        { "value": "Circuit Design", "label": "Circuit Design" },
        { "value": "Panel Installation", "label": "Panel Installation" }
      ]
    },
    "questionSet": {
      "_id": "69141a1903324c06bcdde849",
      "name": "Electrical Questions",
      "questions": [
        {
          "questionId": "q1",
          "text": "What is the primary function of a circuit breaker?",
          "options": [
            { "text": "To interrupt current during overload", "isCorrect": true },
            { "text": "To increase voltage", "isCorrect": false }
          ]
        }
      ],
      "totalQuestions": 1
    }
  }
}
```

**Frontend Action:**
1. **Skills Section:** Show checkboxes/multi-select with `allSkills` array
2. **Questions Section:** Display questions with radio buttons for options
3. User selects skills and answers questions

---

### **3.5 Step 5: User Submits Step 2 Registration**

**API Endpoint:** `POST /api/job-seekers/register/step2`

**Request Body:**
```json
{
  "jobSeekerId": "691419c003324c06bcdde7f9",
  "specializationId": "691419c003324c06bcdde7f9",  // Selected specialization
  "selectedSkills": ["Wiring", "Circuit Design"],   // User-selected skills
  "questionAnswers": [
    {
      "questionId": "q1",
      "questionText": "What is the primary function of a circuit breaker?",
      "selectedOption": "To interrupt current during overload"
    }
  ],
  "role": "Worker"
}
```

**What Happens:**
1. ✅ Validates `specializationId` exists
2. ✅ Validates `selectedSkills` are subset of specialization's skills
3. ✅ Finds `QuestionSet` linked to this specialization
4. ✅ Processes question answers and marks correct/incorrect
5. ✅ Saves to `JobSeeker` document:
   - `specializationId`
   - `selectedSkills`
   - `questionAnswers` (with `isCorrect` flag)
   - `role`

**Database Update:**
```
JobSeeker Collection:
┌─────────────────────────────────────────────────────────┐
│ _id: 691419c003324c06bcdde7f9                          │
│ phone: "9876543210"                                     │
│ specializationId: 691419c003324c06bcdde7f9            │
│ selectedSkills: ["Wiring", "Circuit Design"]           │
│ questionAnswers: [                                      │
│   {                                                     │
│     questionId: "q1",                                   │
│     questionText: "...",                                │
│     selectedOption: "...",                             │
│     isCorrect: true                                    │
│   }                                                     │
│ ]                                                       │
│ registrationStep: 3                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 **Complete Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN CREATES SPECIALIZATION                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        POST /api/admin/specializations
        {
          "name": "Electrical",
          "skills": ["Wiring", "Circuit Design"]
        }
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │   MongoDB: Specialization Collection │
        │   {                                  │
        │     _id: "...",                     │
        │     name: "Electrical",            │
        │     skills: ["Wiring", ...]         │
        │   }                                 │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │   ADMIN CREATES QUESTION SET        │
        │   Links to specialization via        │
        │   specializationIds array           │
        └─────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────┐
        │   MongoDB: QuestionSet Collection   │
        │   {                                  │
        │     specializationIds: ["..."]     │
        │     questions: [...]                │
        │   }                                 │
        └─────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              JOB SEEKER REGISTRATION FLOW                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        Step 1: GET /api/job-seekers/specializations
        ┌─────────────────────────────────────┐
        │   Query: Specialization.find()      │
        │   Filter: { status: "Active" }     │
        │   Returns: All active specializations│
        └─────────────────────────────────────┘
                              │
                              ▼
        Frontend: Populate dropdown
        User selects: "Electrical"
                              │
                              ▼
        Step 2: GET /api/job-seekers/specialization/:id
        ┌─────────────────────────────────────┐
        │   1. Find Specialization by ID      │
        │   2. Find QuestionSet where          │
        │      specializationIds contains ID   │
        │   3. Format skills & questions       │
        └─────────────────────────────────────┘
                              │
                              ▼
        Frontend: Show skills & questions
        User selects skills & answers questions
                              │
                              ▼
        Step 3: POST /api/job-seekers/register/step2
        ┌─────────────────────────────────────┐
        │   1. Validate specializationId       │
        │   2. Validate selectedSkills         │
        │   3. Find QuestionSet                │
        │   4. Process & save to JobSeeker    │
        └─────────────────────────────────────┘
                              │
                              ▼
        Registration Step 2 Complete ✅
```

---

## 📊 **Key Database Relationships**

```
Specialization (1) ──┐
                      │
                      ├──> QuestionSet (Many-to-Many)
                      │    (via specializationIds array)
Specialization (2) ──┘
                      │
                      │
                      ▼
                  JobSeeker
         (references specializationId)
```

---

## 🎯 **Summary**

1. **Admin creates specialization** → Saved in `Specialization` collection
2. **Admin creates question set** → Linked to specialization via `specializationIds`
3. **Job seeker fetches all specializations** → `GET /api/job-seekers/specializations`
4. **Job seeker selects specialization** → Frontend stores `specializationId`
5. **Job seeker fetches skills & questions** → `GET /api/job-seekers/specialization/:id`
6. **Job seeker submits Step 2** → Saves `specializationId`, `selectedSkills`, `questionAnswers` to `JobSeeker`

**Key Points:**
- ✅ Specializations are **admin-managed** (created/updated via admin APIs)
- ✅ Job seekers **only read** specializations (public endpoints)
- ✅ Question sets are **linked** to specializations via `specializationIds` array
- ✅ Skills come **directly** from specialization document
- ✅ Questions come from **QuestionSet** that references the specialization

