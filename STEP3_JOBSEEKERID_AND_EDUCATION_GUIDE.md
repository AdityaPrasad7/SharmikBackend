# Step 3 Registration: jobSeekerId & Education Section Guide

## 📱 Question 1: Will `jobSeekerId` be auto-fetched?

### ❌ **NO** - `jobSeekerId` is NOT auto-fetched

### ✅ **How to get `jobSeekerId`:**

1. **After Step 2 API completes**, you'll receive a response like this:
```json
{
  "success": true,
  "message": "Step 2 completed successfully",
  "data": {
    "jobSeeker": {
      "_id": "691419c003324c06bcdde7f9",  // ← THIS IS YOUR jobSeekerId
      "phone": "9876543210",
      "category": "Diploma Holder",
      "registrationStep": 3,
      // ... other fields
    }
  }
}
```

2. **Save `jobSeeker._id` in your mobile app:**
   - Store it in **localStorage** or **state management**
   - Use it in Step 3 API call

3. **Use it in Step 3:**
```javascript
// In your mobile app
const jobSeekerId = savedJobSeekerId; // From Step 2 response

// Send in Step 3 form-data
formData.append('jobSeekerId', jobSeekerId);
```

---

## 📚 Question 2: Education Section Location Requirements

### ✅ **Education Object Requirements:**

The `education` object **ONLY needs** `collegeInstituteName`:

```json
{
  "collegeInstituteName": "Government Polytechnic, Mumbai"
}
```

### ✅ **Location Fields (State, City, Year) - TWO Options:**

#### **Option 1: Using IDs (RECOMMENDED - From Dropdowns)** ⭐

Send location as **separate fields** using IDs from APIs:

| Field | Type | Source | Example |
|-------|------|--------|---------|
| `stateId` | Text | From `GET /api/location/states` | `691419c003324c06bcdde7f9` |
| `cityId` | Text | From `GET /api/location/cities/state/:stateId` | `691419c003324c06bcdde7b1` |
| `yearOfPassing` | Text | From `GET /api/location/years` | `2023` |

**Form-Data Example:**
```
education: {"collegeInstituteName":"Government Polytechnic, Mumbai"}
stateId: 691419c003324c06bcdde7f9
cityId: 691419c003324c06bcdde7b1
yearOfPassing: 2023
```

#### **Option 2: Using Names (Backward Compatible)**

Send location **inside** the `education` object as names:

```json
{
  "collegeInstituteName": "Government Polytechnic, Mumbai",
  "state": "Maharashtra",
  "city": "Mumbai",
  "yearOfPassing": "2023"
}
```

**⚠️ Note:** Option 1 (IDs) is **RECOMMENDED** because:
- ✅ Validates that state/city exist in database
- ✅ Ensures city belongs to selected state
- ✅ Consistent with dropdown selection
- ✅ Backend resolves IDs to names automatically

---

## 📋 Complete Step 3 Form-Data Structure

### **Recommended Structure (Using IDs):**

| Key | Type | Value | Required |
|-----|------|-------|----------|
| `jobSeekerId` | Text | From Step 2 response | ✅ Yes |
| `education` | Text | `{"collegeInstituteName":"..."}` | ✅ Yes |
| `stateId` | Text | From states API | ✅ Yes |
| `cityId` | Text | From cities API | ✅ Yes |
| `yearOfPassing` | Text | From years API | ✅ Yes |
| `percentageOrGrade` | Text | User input (e.g., "85%") | ✅ Yes |
| `experienceStatus` | Text | `{"hasExperience":false,"isFresher":true}` | ✅ Yes |
| `resume` | File | PDF/document | ✅ Yes |
| `experienceCertificate` | File | PDF/document | ⚠️ If hasExperience=true |
| `documents` | File | PDF/document | ❌ Optional |

---

## 🔄 Complete Flow Example

### **Step 1: Get jobSeekerId from Step 2**

```javascript
// Step 2 API Response
POST /api/job-seekers/register/step2

Response:
{
  "success": true,
  "data": {
    "jobSeeker": {
      "_id": "691419c003324c06bcdde7f9"  // ← Save this!
    }
  }
}

// Save in mobile app
localStorage.setItem('jobSeekerId', '691419c003324c06bcdde7f9');
```

### **Step 2: Get Location IDs from APIs**

```javascript
// Get States
GET /api/location/states
// Response: [{ "_id": "...", "name": "Maharashtra", ... }]

// Get Cities for selected State
GET /api/location/cities/state/691419c003324c06bcdde7f9
// Response: [{ "_id": "...", "name": "Mumbai", ... }]

// Get Years
GET /api/location/years
// Response: [{ "value": "2023", "label": "2023", ... }]
```

### **Step 3: Submit Step 3 with all data**

```javascript
// Form-Data
const formData = new FormData();
formData.append('jobSeekerId', localStorage.getItem('jobSeekerId'));
formData.append('education', JSON.stringify({
  collegeInstituteName: "Government Polytechnic, Mumbai"
}));
formData.append('stateId', selectedStateId);
formData.append('cityId', selectedCityId);
formData.append('yearOfPassing', selectedYear);
formData.append('percentageOrGrade', '85%');
formData.append('experienceStatus', JSON.stringify({
  hasExperience: false,
  isFresher: true
}));
formData.append('resume', resumeFile);
```

---

## ✅ Summary

1. **jobSeekerId**: 
   - ❌ NOT auto-fetched
   - ✅ Get from Step 2 API response (`jobSeeker._id`)
   - ✅ Store in mobile app (localStorage/state)
   - ✅ Send in Step 3 form-data

2. **Education Section**:
   - ✅ `education` object: **ONLY** `collegeInstituteName` required
   - ✅ Location: Send as **separate fields** (`stateId`, `cityId`, `yearOfPassing`)
   - ✅ Backend automatically resolves IDs to names
   - ✅ Validates state/city relationships

---

## 🎯 Quick Reference

```javascript
// Step 3 Form-Data (Recommended)
{
  jobSeekerId: "from_step2_response",
  education: '{"collegeInstituteName":"College Name"}',
  stateId: "from_states_api",
  cityId: "from_cities_api",
  yearOfPassing: "from_years_api",
  percentageOrGrade: "85%",
  experienceStatus: '{"hasExperience":false,"isFresher":true}',
  resume: [FILE],
  experienceCertificate: [FILE - if hasExperience=true]
}
```

