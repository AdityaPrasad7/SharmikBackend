# Step 3 Registration - Complete Guide

## Overview

Step 3 is the final step for Diploma/ITI Holder registration. It includes:
- Education Details (with state/city dropdowns and year dropdown)
- Experience Status (toggle button)
- Resume Upload (required)
- Experience Certificate Upload (conditional - required if has experience)
- Additional Documents Upload (optional)

---

## Complete API Flow

### Step 1: Get States (for Education State dropdown)
```
GET http://localhost:8000/api/location/states
```

**Response:**
```json
{
  "success": true,
  "data": {
    "states": [
      {
        "_id": "691419c003324c06bcdde7f9",
        "value": "691419c003324c06bcdde7f9",
        "label": "Maharashtra",
        "name": "Maharashtra",
        "code": "MH"
      }
    ]
  }
}
```

---

### Step 2: Get Cities (for Education City dropdown - when state selected)
```
GET http://localhost:8000/api/location/cities/state/:stateId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "state": { "name": "Maharashtra", "code": "MH" },
    "cities": [
      {
        "_id": "691419c003324c06bcdde7b1",
        "value": "691419c003324c06bcdde7b1",
        "label": "Mumbai",
        "name": "Mumbai"
      }
    ]
  }
}
```

---

### Step 3: Get Years (for Year of Passing dropdown)
```
GET http://localhost:8000/api/location/years
```

**Response:**
```json
{
  "success": true,
  "data": {
    "years": [
      {
        "value": "2024",
        "label": "2024",
        "year": 2024
      },
      {
        "value": "2023",
        "label": "2023",
        "year": 2023
      },
      // ... last 100 years (descending order)
      {
        "value": "1925",
        "label": "1925",
        "year": 1925
      }
    ],
    "currentYear": 2024,
    "startYear": 1925,
    "totalYears": 100
  }
}
```

**Note:** Years are auto-incrementing - they automatically update each year!

---

### Step 4: Submit Step 3 Registration
```
POST http://localhost:8000/api/job-seekers/register/step3
Content-Type: multipart/form-data
```

---

## Toggle Button Logic

### Toggle OFF (Fresher)
- **UI State**: Toggle is OFF
- **Backend Values**:
  ```json
  {
    "hasExperience": false,
    "isFresher": true
  }
  ```
- **Experience Certificate**: ❌ NOT required

### Toggle ON (Experienced)
- **UI State**: Toggle is ON
- **Backend Values**:
  ```json
  {
    "hasExperience": true,
    "isFresher": false
  }
  ```
- **Experience Certificate**: ✅ REQUIRED

---

## Complete Step 3 API Request

### Scenario A: Fresher (Toggle OFF)

**Endpoint:**
```
POST http://localhost:8000/api/job-seekers/register/step3
Content-Type: multipart/form-data
```

**Form Data:**
| Key | Type | Value |
|-----|------|-------|
| `jobSeekerId` | Text | `691419c003324c06bcdde7f9` |
| `education` | Text | `{"collegeInstituteName":"ABC College","city":"Mumbai","state":"Maharashtra","yearOfPassing":"2023","percentageOrGrade":"85%"}` |
| `experienceStatus` | Text | `{"hasExperience":false,"isFresher":true}` |
| `resume` | File | [Select resume.pdf] |
| `documents` | File | [Optional - select additional documents] |

---

### Scenario B: Experienced (Toggle ON)

**Endpoint:**
```
POST http://localhost:8000/api/job-seekers/register/step3
Content-Type: multipart/form-data
```

**Form Data:**
| Key | Type | Value |
|-----|------|-------|
| `jobSeekerId` | Text | `691419c003324c06bcdde7f9` |
| `education` | Text | `{"collegeInstituteName":"ABC College","city":"Mumbai","state":"Maharashtra","yearOfPassing":"2023","percentageOrGrade":"85%"}` |
| `experienceStatus` | Text | `{"hasExperience":true,"isFresher":false}` |
| `resume` | File | [Select resume.pdf] |
| `experienceCertificate` | File | [Select experience_certificate.pdf] **REQUIRED** |
| `documents` | File | [Optional - select additional documents] |

---

## Education Object Structure

```json
{
  "collegeInstituteName": "ABC College",  // ✅ Required - Text input
  "city": "Mumbai",                       // ✅ Required - From city dropdown (use city name)
  "state": "Maharashtra",                 // ✅ Required - From state dropdown (use state name)
  "yearOfPassing": "2023",                // ✅ Required - From years dropdown (use year value)
  "percentageOrGrade": "85%"              // ✅ Required - Text input
}
```

**Note:** You can use state/city names OR stateId/cityId. The backend accepts both.

---

## Mobile App Implementation

### Complete React Native Example

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, Picker, Switch, TouchableOpacity } from 'react-native';

const Step3RegistrationScreen = () => {
  // Dropdown Data
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [years, setYears] = useState([]);
  
  // Selected Values
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [selectedCityId, setSelectedCityId] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  
  // Form Fields
  const [collegeName, setCollegeName] = useState('');
  const [percentage, setPercentage] = useState('');
  const [hasExperience, setHasExperience] = useState(false); // Toggle state
  const [resume, setResume] = useState(null);
  const [experienceCertificate, setExperienceCertificate] = useState(null);

  // Load dropdowns on mount
  useEffect(() => {
    fetchStates();
    fetchYears();
  }, []);

  // Fetch States
  const fetchStates = async () => {
    const response = await fetch('http://localhost:8000/api/location/states');
    const { data } = await response.json();
    setStates(data.states);
  };

  // Fetch Cities when state selected
  const handleStateChange = async (stateId) => {
    setSelectedStateId(stateId);
    setSelectedCityId(null);
    setCities([]);
    
    if (stateId) {
      const response = await fetch(
        `http://localhost:8000/api/location/cities/state/${stateId}`
      );
      const { data } = await response.json();
      setCities(data.cities);
    }
  };

  // Fetch Years
  const fetchYears = async () => {
    const response = await fetch('http://localhost:8000/api/location/years');
    const { data } = await response.json();
    setYears(data.years);
  };

  // Handle Toggle Change
  const handleToggleChange = (value) => {
    setHasExperience(value);
    if (!value) {
      // If toggle OFF, clear experience certificate
      setExperienceCertificate(null);
    }
  };

  // Submit Step 3
  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      
      // Get state and city names from IDs
      const selectedState = states.find(s => s._id === selectedStateId);
      const selectedCity = cities.find(c => c._id === selectedCityId);
      
      // Add jobSeekerId
      formData.append('jobSeekerId', jobSeekerId);
      
      // Add education (as JSON string)
      formData.append('education', JSON.stringify({
        collegeInstituteName: collegeName,
        city: selectedCity?.name || '',
        state: selectedState?.name || '',
        yearOfPassing: selectedYear,
        percentageOrGrade: percentage
      }));
      
      // Add experienceStatus (as JSON string)
      formData.append('experienceStatus', JSON.stringify({
        hasExperience: hasExperience,  // true if toggle ON
        isFresher: !hasExperience      // true if toggle OFF
      }));
      
      // Add resume (required)
      formData.append('resume', {
        uri: resume.uri,
        type: 'application/pdf',
        name: 'resume.pdf'
      });
      
      // Add experienceCertificate (if toggle ON)
      if (hasExperience && experienceCertificate) {
        formData.append('experienceCertificate', {
          uri: experienceCertificate.uri,
          type: 'application/pdf',
          name: 'experience_certificate.pdf'
        });
      }
      
      // Submit
      const response = await fetch(
        'http://localhost:8000/api/job-seekers/register/step3',
        {
          method: 'POST',
          body: formData
        }
      );
      
      const result = await response.json();
      if (result.success) {
        // ✅ Registration Complete!
        console.log('Registration completed successfully!');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <View>
      {/* Education Details */}
      <Text>College/Institute Name *</Text>
      <TextInput
        value={collegeName}
        onChangeText={setCollegeName}
        placeholder="e.g., Government Polytechnic, Mumbai"
      />

      {/* State Dropdown */}
      <Text>State *</Text>
      <Picker
        selectedValue={selectedStateId}
        onValueChange={handleStateChange}
      >
        <Picker.Item label="Select State" value={null} />
        {states.map((state) => (
          <Picker.Item key={state._id} label={state.label} value={state._id} />
        ))}
      </Picker>

      {/* City Dropdown */}
      <Text>City *</Text>
      <Picker
        selectedValue={selectedCityId}
        onValueChange={setSelectedCityId}
        enabled={cities.length > 0}
      >
        <Picker.Item 
          label={cities.length > 0 ? "Select City" : "Select State First"} 
          value={null} 
        />
        {cities.map((city) => (
          <Picker.Item key={city._id} label={city.label} value={city._id} />
        ))}
      </Picker>

      {/* Year of Passing Dropdown */}
      <Text>Year of Passing *</Text>
      <Picker
        selectedValue={selectedYear}
        onValueChange={setSelectedYear}
      >
        <Picker.Item label="Select Year" value={null} />
        {years.map((year) => (
          <Picker.Item key={year.year} label={year.label} value={year.value} />
        ))}
      </Picker>

      <Text>Percentage / Grade *</Text>
      <TextInput
        value={percentage}
        onChangeText={setPercentage}
        placeholder="e.g., 85% or A+"
      />

      {/* Experience Status Toggle */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text>{hasExperience ? 'Not a Fresher' : 'Currently a Fresher'}</Text>
        <Switch
          value={hasExperience}
          onValueChange={handleToggleChange}
        />
      </View>

      {/* Resume Upload */}
      <Text>Upload Resume *</Text>
      <TouchableOpacity onPress={selectResume}>
        <Text>Select Resume</Text>
      </TouchableOpacity>

      {/* Experience Certificate (only if toggle ON) */}
      {hasExperience && (
        <View>
          <Text>Upload Experience Certificate *</Text>
          <TouchableOpacity onPress={selectExperienceCertificate}>
            <Text>Select Experience Certificate</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity onPress={handleSubmit}>
        <Text>Submit & Complete Registration</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Step3RegistrationScreen;
```

---

## Summary: What's Done vs What's Required

### ✅ Already Done:

1. **State API** - `GET /api/location/states` ✅
2. **City API** - `GET /api/location/cities/state/:stateId` ✅
3. **Years API** - `GET /api/location/years` ✅ (Just added)
4. **Toggle Logic** - Backend handles `hasExperience` and `isFresher` ✅
5. **Experience Certificate** - Conditionally required in Step 3 API ✅
6. **Step 3 API** - `POST /api/job-seekers/register/step3` ✅

### ✅ All Requirements Met:

- ✅ State dropdown API
- ✅ City dropdown API (based on state)
- ✅ Years dropdown API (last 100 years, auto-incrementing)
- ✅ Toggle button logic (OFF = fresher, ON = experienced)
- ✅ Experience certificate upload (conditional)
- ✅ Step 3 registration API (complete)

---

## Complete API Endpoints Summary

| Purpose | Endpoint | Method |
|---------|----------|--------|
| Get States | `/api/location/states` | GET |
| Get Cities | `/api/location/cities/state/:stateId` | GET |
| Get Years | `/api/location/years` | GET |
| Submit Step 3 | `/api/job-seekers/register/step3` | POST |

---

## Testing Checklist

1. ✅ Call `GET /api/location/states` → Populate state dropdown
2. ✅ Select state → Call `GET /api/location/cities/state/:stateId` → Populate city dropdown
3. ✅ Call `GET /api/location/years` → Populate year dropdown
4. ✅ Toggle OFF → `hasExperience: false, isFresher: true` → No experience certificate needed
5. ✅ Toggle ON → `hasExperience: true, isFresher: false` → Experience certificate required
6. ✅ Submit Step 3 → Registration complete!

Everything is ready! 🚀

