# How to Use State & City Dropdowns in Non-Degree Registration

## Overview

The registration form now supports **state and city dropdowns** that fetch data from the backend. You can use either:
- **Option 1**: State/City IDs (from dropdowns) - **Recommended**
- **Option 2**: State/City names (text input) - **Backward compatible**

---

## API Endpoints

### 1. Get All States
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

### 2. Get Cities by State
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

## Mobile App Implementation (React Native)

### Complete Example

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, Picker, TouchableOpacity } from 'react-native';

const NonDegreeRegistrationScreen = () => {
  // States and Cities Data
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  
  // Selected Values
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [selectedCityId, setSelectedCityId] = useState(null);
  
  // Other form fields
  const [phone, setPhone] = useState('');
  const [specializationId, setSpecializationId] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);

  // Load states on component mount
  useEffect(() => {
    fetchStates();
  }, []);

  // Fetch all states
  const fetchStates = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/location/states');
      const { data } = await response.json();
      setStates(data.states);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  // Fetch cities when state is selected
  const handleStateChange = async (stateId) => {
    setSelectedStateId(stateId);
    setSelectedCityId(null); // Reset city selection
    setCities([]); // Clear cities

    if (stateId) {
      try {
        const response = await fetch(
          `http://localhost:8000/api/location/cities/state/${stateId}`
        );
        const { data } = await response.json();
        setCities(data.cities);
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    }
  };

  // Submit registration
  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      
      // Add form fields
      formData.append('phone', phone);
      formData.append('stateId', selectedStateId);  // ✅ Use stateId from dropdown
      formData.append('cityId', selectedCityId);    // ✅ Use cityId from dropdown
      formData.append('specializationId', specializationId);
      formData.append('selectedSkills', JSON.stringify(selectedSkills));
      
      // Add files
      formData.append('aadhaarCard', aadhaarFile);
      formData.append('profilePhoto', profileFile);

      const response = await fetch(
        'http://localhost:8000/api/job-seekers/register/non-degree',
        {
          method: 'POST',
          body: formData
        }
      );

      const result = await response.json();
      if (result.success) {
        // Registration successful
        console.log('Registration completed!');
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <View>
      {/* State Dropdown */}
      <Text>Select State *</Text>
      <Picker
        selectedValue={selectedStateId}
        onValueChange={handleStateChange}
      >
        <Picker.Item label="Select State" value={null} />
        {states.map((state) => (
          <Picker.Item
            key={state._id}
            label={state.label}
            value={state._id}
          />
        ))}
      </Picker>

      {/* City Dropdown */}
      <Text>Select City *</Text>
      <Picker
        selectedValue={selectedCityId}
        onValueChange={setSelectedCityId}
        enabled={cities.length > 0} // Disable until state is selected
      >
        <Picker.Item 
          label={cities.length > 0 ? "Select City" : "Select State First"} 
          value={null} 
        />
        {cities.map((city) => (
          <Picker.Item
            key={city._id}
            label={city.label}
            value={city._id}
          />
        ))}
      </Picker>

      {/* Submit Button */}
      <TouchableOpacity onPress={handleSubmit}>
        <Text>Submit Registration</Text>
      </TouchableOpacity>
    </View>
  );
};

export default NonDegreeRegistrationScreen;
```

---

## Postman Testing

### Option 1: Using State/City IDs (Recommended)

**Request:**
```
POST http://localhost:8000/api/job-seekers/register/non-degree
Content-Type: multipart/form-data
```

**Form Data:**
| Key | Type | Value |
|-----|------|-------|
| `phone` | Text | `9876543210` |
| `stateId` | Text | `691419c003324c06bcdde7f9` |
| `cityId` | Text | `691419c003324c06bcdde7b1` |
| `specializationId` | Text | `69146392f6255cc7b5068554` |
| `selectedSkills` | Text | `["Video Editing","Basic Animation","Content Writing"]` |
| `aadhaarCard` | File | [Select file] |
| `profilePhoto` | File | [Select file] |

### Option 2: Using State/City Names (Backward Compatible)

**Form Data:**
| Key | Type | Value |
|-----|------|-------|
| `phone` | Text | `9876543210` |
| `state` | Text | `Maharashtra` |
| `city` | Text | `Mumbai` |
| `specializationId` | Text | `69146392f6255cc7b5068554` |
| `selectedSkills` | Text | `["Video Editing","Basic Animation","Content Writing"]` |
| `aadhaarCard` | File | [Select file] |
| `profilePhoto` | File | [Select file] |

---

## Step-by-Step Flow

### 1. On Screen Load
```javascript
// Fetch all states
GET /api/location/states
→ Populate state dropdown
```

### 2. When User Selects State
```javascript
// Fetch cities for selected state
GET /api/location/cities/state/:stateId
→ Populate city dropdown
→ Enable city dropdown
```

### 3. When User Submits Form
```javascript
// Send stateId and cityId (or state and city names)
POST /api/job-seekers/register/non-degree
Body: {
  stateId: "...",
  cityId: "...",
  // ... other fields
}
```

---

## Backend Behavior

The backend automatically:
1. ✅ Accepts both `stateId/cityId` OR `state/city` names
2. ✅ Resolves IDs to names if IDs are provided
3. ✅ Validates that city belongs to selected state
4. ✅ Stores state and city names in database (for consistency)

---

## Benefits of Using Dropdowns

✅ **Data Consistency**: Only valid states/cities can be selected  
✅ **Better UX**: Users don't need to type, just select  
✅ **Validation**: Backend validates city belongs to state  
✅ **Auto-complete**: No typos or invalid entries  
✅ **Scalable**: Easy to add more cities in the future  

---

## Summary

1. **Fetch States**: `GET /api/location/states` on page load
2. **Fetch Cities**: `GET /api/location/cities/state/:stateId` when state selected
3. **Submit Form**: Send `stateId` and `cityId` in registration request
4. **Backend**: Automatically resolves IDs to names and validates

The system is ready to use! 🚀

