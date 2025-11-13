# State & City API Documentation

## Overview

This API provides endpoints to fetch Indian states and cities for dropdown selection in registration forms. All states and cities are automatically seeded on application startup.

---

## API Endpoints

### 1. Get All States

**Endpoint:** `GET /api/location/states`

**Description:** Returns all active Indian states for dropdown selection.

**Response:**
```json
{
  "success": true,
  "message": "States fetched successfully",
  "data": {
    "states": [
      {
        "_id": "691419c003324c06bcdde7f9",
        "value": "691419c003324c06bcdde7f9",
        "label": "Maharashtra",
        "name": "Maharashtra",
        "code": "MH"
      },
      {
        "_id": "691419c003324c06bcdde7a1",
        "value": "691419c003324c06bcdde7a1",
        "label": "Delhi",
        "name": "Delhi",
        "code": "DL"
      }
    ]
  }
}
```

**Usage:**
- Populate state dropdown in registration forms
- Use `_id` or `value` as the state identifier
- Use `label` or `name` for display

---

### 2. Get Cities by State ID

**Endpoint:** `GET /api/location/cities/state/:stateId`

**Description:** Returns all active cities for a specific state.

**Parameters:**
- `stateId` (URL parameter): MongoDB ObjectId of the state

**Example:**
```
GET /api/location/cities/state/691419c003324c06bcdde7f9
```

**Response:**
```json
{
  "success": true,
  "message": "Cities fetched successfully",
  "data": {
    "state": {
      "_id": "691419c003324c06bcdde7f9",
      "name": "Maharashtra",
      "code": "MH"
    },
    "cities": [
      {
        "_id": "691419c003324c06bcdde7b1",
        "value": "691419c003324c06bcdde7b1",
        "label": "Mumbai",
        "name": "Mumbai",
        "stateId": "691419c003324c06bcdde7f9",
        "stateName": "Maharashtra"
      },
      {
        "_id": "691419c003324c06bcdde7b2",
        "value": "691419c003324c06bcdde7b2",
        "label": "Pune",
        "name": "Pune",
        "stateId": "691419c003324c06bcdde7f9",
        "stateName": "Maharashtra"
      }
    ]
  }
}
```

**Usage:**
- Call this API when user selects a state
- Populate city dropdown with the returned cities
- Use `_id` or `value` as the city identifier

---

### 3. Get Cities by State Name (Alternative)

**Endpoint:** `GET /api/location/cities/state-name/:stateName`

**Description:** Returns all active cities for a specific state by state name (case-insensitive).

**Parameters:**
- `stateName` (URL parameter): Name of the state (e.g., "Maharashtra", "Delhi")

**Example:**
```
GET /api/location/cities/state-name/Maharashtra
```

**Response:** Same format as Get Cities by State ID

**Usage:**
- Alternative endpoint if you're using state names instead of IDs
- Useful for backward compatibility

---

## Frontend Implementation Example

### React Native / Mobile App

```javascript
import React, { useState, useEffect } from 'react';
import { View, Picker } from 'react-native';

const LocationSelector = () => {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedStateId, setSelectedStateId] = useState(null);
  const [selectedCityId, setSelectedCityId] = useState(null);

  // Fetch all states on component mount
  useEffect(() => {
    fetchStates();
  }, []);

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

  return (
    <View>
      {/* State Dropdown */}
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
      <Picker
        selectedValue={selectedCityId}
        onValueChange={setSelectedCityId}
        enabled={cities.length > 0}
      >
        <Picker.Item label="Select City" value={null} />
        {cities.map((city) => (
          <Picker.Item
            key={city._id}
            label={city.label}
            value={city._id}
          />
        ))}
      </Picker>
    </View>
  );
};

export default LocationSelector;
```

---

## Registration Form Integration

### Non-Degree Registration

When submitting the registration form, you can send either:

**Option 1: State and City IDs (Recommended)**
```json
{
  "phone": "9876543210",
  "stateId": "691419c003324c06bcdde7f9",
  "cityId": "691419c003324c06bcdde7b1",
  "specializationId": "...",
  "selectedSkills": [...]
}
```

**Option 2: State and City Names (Backward Compatible)**
```json
{
  "phone": "9876543210",
  "state": "Maharashtra",
  "city": "Mumbai",
  "specializationId": "...",
  "selectedSkills": [...]
}
```

The backend currently accepts both formats for backward compatibility.

---

## Seeded Data

### States Included:
- All 28 Indian States
- All 8 Union Territories
- Total: 36 states/UTs

### Cities Included:
- Major cities for each state
- Approximately 200+ cities across India
- All cities are linked to their respective states

### Data Seeding:
- States and cities are automatically seeded on application startup
- Seeding is idempotent (safe to run multiple times)
- Only creates new records, doesn't duplicate existing ones

---

## Database Models

### State Model
```javascript
{
  _id: ObjectId,
  name: String (unique),      // e.g., "Maharashtra"
  code: String (unique),      // e.g., "MH"
  status: "Active" | "Inactive",
  timestamps: true
}
```

### City Model
```javascript
{
  _id: ObjectId,
  name: String,               // e.g., "Mumbai"
  stateId: ObjectId (ref: State),
  stateName: String,          // e.g., "Maharashtra"
  status: "Active" | "Inactive",
  timestamps: true
}
```

---

## Best Practices

1. **Use State/City IDs**: Prefer using IDs over names for better data integrity
2. **Cache States**: States don't change often, cache them on the frontend
3. **Lazy Load Cities**: Only fetch cities when a state is selected
4. **Handle Loading States**: Show loading indicators while fetching cities
5. **Error Handling**: Always handle API errors gracefully

---

## API Testing (Postman)

### Test Get All States
```
GET http://localhost:8000/api/location/states
```

### Test Get Cities by State ID
```
GET http://localhost:8000/api/location/cities/state/691419c003324c06bcdde7f9
```

### Test Get Cities by State Name
```
GET http://localhost:8000/api/location/cities/state-name/Maharashtra
```

---

## Summary

✅ **States API**: Get all Indian states for dropdown  
✅ **Cities API**: Get cities by state ID or name  
✅ **Auto-Seeding**: States and cities seeded automatically  
✅ **Backward Compatible**: Supports both IDs and names  
✅ **Ready to Use**: APIs are production-ready

