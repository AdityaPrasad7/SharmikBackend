# Mobile App: Where to Store jobSeekerId

## 📱 Understanding the Response Structure

### **Step 2 API Response:**
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

**Extract:** `response.data.jobSeeker._id` is your `jobSeekerId`

---

## 💾 Where to Store jobSeekerId in Mobile App

### **Option 1: React Native (AsyncStorage)** ⭐ Recommended

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// After Step 2 API success
const handleStep2Success = async (response) => {
  const jobSeekerId = response.data.jobSeeker._id;
  
  // Store in AsyncStorage
  await AsyncStorage.setItem('jobSeekerId', jobSeekerId);
  
  // Navigate to Step 3
  navigation.navigate('Step3');
};

// In Step 3, retrieve it
const getJobSeekerId = async () => {
  const jobSeekerId = await AsyncStorage.getItem('jobSeekerId');
  return jobSeekerId;
};

// Use in Step 3 API call
const submitStep3 = async () => {
  const jobSeekerId = await AsyncStorage.getItem('jobSeekerId');
  
  const formData = new FormData();
  formData.append('jobSeekerId', jobSeekerId);
  // ... other fields
};
```

---

### **Option 2: React Native (Context/State Management)**

```javascript
// Create a RegistrationContext
import React, { createContext, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RegistrationContext = createContext();

export const RegistrationProvider = ({ children }) => {
  const [jobSeekerId, setJobSeekerId] = useState(null);

  const saveJobSeekerId = async (id) => {
    setJobSeekerId(id);
    await AsyncStorage.setItem('jobSeekerId', id);
  };

  const loadJobSeekerId = async () => {
    const id = await AsyncStorage.getItem('jobSeekerId');
    if (id) {
      setJobSeekerId(id);
    }
    return id;
  };

  return (
    <RegistrationContext.Provider value={{ jobSeekerId, saveJobSeekerId, loadJobSeekerId }}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = () => useContext(RegistrationContext);

// Usage in Step 2 component
const Step2Screen = () => {
  const { saveJobSeekerId } = useRegistration();
  
  const handleStep2Submit = async (data) => {
    const response = await api.post('/api/job-seekers/register/step2', data);
    await saveJobSeekerId(response.data.jobSeeker._id);
    navigation.navigate('Step3');
  };
};

// Usage in Step 3 component
const Step3Screen = () => {
  const { jobSeekerId } = useRegistration();
  
  const handleStep3Submit = async (data) => {
    const formData = new FormData();
    formData.append('jobSeekerId', jobSeekerId);
    // ... other fields
  };
};
```

---

### **Option 3: Flutter (SharedPreferences)**

```dart
import 'package:shared_preferences/shared_preferences.dart';

// After Step 2 API success
Future<void> handleStep2Success(Map<String, dynamic> response) async {
  final jobSeekerId = response['data']['jobSeeker']['_id'];
  
  // Store in SharedPreferences
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString('jobSeekerId', jobSeekerId);
  
  // Navigate to Step 3
  Navigator.pushNamed(context, '/step3');
}

// In Step 3, retrieve it
Future<String?> getJobSeekerId() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getString('jobSeekerId');
}

// Use in Step 3 API call
Future<void> submitStep3() async {
  final prefs = await SharedPreferences.getInstance();
  final jobSeekerId = prefs.getString('jobSeekerId');
  
  final formData = FormData();
  formData.fields.add(MapEntry('jobSeekerId', jobSeekerId!));
  // ... other fields
}
```

---

### **Option 4: Flutter (Provider/State Management)**

```dart
// Create a RegistrationProvider
class RegistrationProvider extends ChangeNotifier {
  String? _jobSeekerId;
  
  String? get jobSeekerId => _jobSeekerId;
  
  Future<void> saveJobSeekerId(String id) async {
    _jobSeekerId = id;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jobSeekerId', id);
    notifyListeners();
  }
  
  Future<void> loadJobSeekerId() async {
    final prefs = await SharedPreferences.getInstance();
    _jobSeekerId = prefs.getString('jobSeekerId');
    notifyListeners();
  }
}

// Usage in Step 2
final registrationProvider = Provider.of<RegistrationProvider>(context);
await registrationProvider.saveJobSeekerId(response.data.jobSeeker._id);

// Usage in Step 3
final jobSeekerId = registrationProvider.jobSeekerId;
```

---

### **Option 5: React Native (Redux/Redux Toolkit)**

```javascript
// Redux slice
import { createSlice } from '@reduxjs/toolkit';

const registrationSlice = createSlice({
  name: 'registration',
  initialState: {
    jobSeekerId: null,
  },
  reducers: {
    setJobSeekerId: (state, action) => {
      state.jobSeekerId = action.payload;
      // Also save to AsyncStorage
      AsyncStorage.setItem('jobSeekerId', action.payload);
    },
  },
});

export const { setJobSeekerId } = registrationSlice.actions;
export default registrationSlice.reducer;

// Usage in Step 2
import { useDispatch } from 'react-redux';
import { setJobSeekerId } from './store/registrationSlice';

const Step2Screen = () => {
  const dispatch = useDispatch();
  
  const handleStep2Submit = async (data) => {
    const response = await api.post('/api/job-seekers/register/step2', data);
    dispatch(setJobSeekerId(response.data.jobSeeker._id));
    navigation.navigate('Step3');
  };
};

// Usage in Step 3
import { useSelector } from 'react-redux';

const Step3Screen = () => {
  const jobSeekerId = useSelector((state) => state.registration.jobSeekerId);
  
  const handleStep3Submit = async (data) => {
    const formData = new FormData();
    formData.append('jobSeekerId', jobSeekerId);
    // ... other fields
  };
};
```

---

### **Option 6: Simple Component State (Temporary - Not Recommended for Production)**

```javascript
// Only use if registration happens in single session
// ⚠️ Will be lost if app closes or user navigates away

const RegistrationFlow = () => {
  const [jobSeekerId, setJobSeekerId] = useState(null);
  
  // Step 2
  const handleStep2 = async (data) => {
    const response = await api.post('/api/job-seekers/register/step2', data);
    setJobSeekerId(response.data.jobSeeker._id);
  };
  
  // Step 3
  const handleStep3 = async (data) => {
    const formData = new FormData();
    formData.append('jobSeekerId', jobSeekerId);
    // ... other fields
  };
};
```

---

## 🔄 Complete Flow Example (React Native)

```javascript
// Step 2 Component
import AsyncStorage from '@react-native-async-storage/async-storage';

const Step2Screen = ({ navigation }) => {
  const handleSubmit = async (formData) => {
    try {
      // Call Step 2 API
      const response = await fetch('https://your-api.com/api/job-seekers/register/step2', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Extract jobSeekerId from response
        const jobSeekerId = result.data.jobSeeker._id;
        
        // Store it
        await AsyncStorage.setItem('jobSeekerId', jobSeekerId);
        
        // Navigate to Step 3
        navigation.navigate('Step3');
      }
    } catch (error) {
      console.error('Step 2 error:', error);
    }
  };
  
  return (
    // Your Step 2 form UI
  );
};

// Step 3 Component
const Step3Screen = ({ navigation }) => {
  const handleSubmit = async (formData) => {
    try {
      // Retrieve jobSeekerId
      const jobSeekerId = await AsyncStorage.getItem('jobSeekerId');
      
      if (!jobSeekerId) {
        alert('Please complete Step 2 first');
        return;
      }
      
      // Add jobSeekerId to form data
      formData.append('jobSeekerId', jobSeekerId);
      
      // Call Step 3 API
      const response = await fetch('https://your-api.com/api/job-seekers/register/step3', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Registration complete!
        navigation.navigate('Success');
      }
    } catch (error) {
      console.error('Step 3 error:', error);
    }
  };
  
  return (
    // Your Step 3 form UI
  );
};
```

---

## ✅ Best Practices

1. **Always use persistent storage** (AsyncStorage/SharedPreferences) - not just state
2. **Save immediately after Step 2** - don't wait until Step 3
3. **Load on app start** - check if user has incomplete registration
4. **Clear on completion** - remove `jobSeekerId` after successful registration
5. **Handle errors** - if `jobSeekerId` is missing, redirect to Step 2

---

## 🧹 Cleanup After Registration

```javascript
// After successful Step 3 completion
const handleRegistrationComplete = async () => {
  // Clear jobSeekerId from storage
  await AsyncStorage.removeItem('jobSeekerId');
  
  // Navigate to success/home screen
  navigation.navigate('Home');
};
```

---

## 📝 Summary

**Where to store:**
- ✅ **AsyncStorage** (React Native) or **SharedPreferences** (Flutter) - Persistent storage
- ✅ **Context/State Management** - For app-wide access
- ❌ **Component State Only** - Will be lost on navigation/app close

**When to store:**
- ✅ Immediately after Step 2 API success
- ✅ Extract from `response.data.jobSeeker._id`

**How to use:**
- ✅ Retrieve from storage in Step 3
- ✅ Add to form-data: `formData.append('jobSeekerId', jobSeekerId)`

