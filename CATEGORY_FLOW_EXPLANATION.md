# Category Flow - Frontend to Backend Code Explanation

## 📱 Frontend Code (React/React Native Example)

### **Step 1: Category Selection Screen**

```javascript
// CategorySelectionScreen.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CategorySelectionScreen() {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  // Fetch categories from API
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('https://sharmik-backend-26c3.vercel.app/api/job-seekers/categories');
      const data = await response.json();
      setCategories(data.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // When user clicks on a category card
  const handleCategorySelect = (categoryName) => {
    // ✅ AUTOMATICALLY SAVE TO LOCALSTORAGE
    localStorage.setItem('selectedCategory', categoryName);
    
    // Navigate to phone verification screen
    navigate('/phone-verification');
  };

  return (
    <div>
      <h2>Choose Your Category</h2>
      {categories.map((category) => (
        <div 
          key={category.value}
          onClick={() => handleCategorySelect(category.value)}
          className="category-card"
        >
          <h3>{category.label}</h3>
          <p>{category.description}</p>
        </div>
      ))}
    </div>
  );
}
```

---

### **Step 2: Phone Verification Screen**

```javascript
// PhoneVerificationScreen.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function PhoneVerificationScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  // ✅ AUTOMATICALLY FETCH CATEGORY FROM LOCALSTORAGE
  const category = localStorage.getItem('selectedCategory'); 
  // category = "Non-Degree Holder" (automatically retrieved)

  const handleSendOTP = async () => {
    try {
      // ✅ Category automatically included from localStorage
      const response = await fetch('https://sharmik-backend-26c3.vercel.app/api/job-seekers/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          category: category // ✅ Auto-filled from localStorage
        }),
      });

      const data = await response.json();
      if (data.success) {
        setOtpSent(true);
        alert(`OTP sent! (Dev: ${data.data.otp})`);
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      // ✅ Category automatically included from localStorage
      const response = await fetch('https://sharmik-backend-26c3.vercel.app/api/job-seekers/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          otp: otp,
          category: category // ✅ Auto-filled from localStorage - SENT TO BACKEND
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Category is now saved in database ✅
        const jobSeekerId = data.data.jobSeeker._id;
        localStorage.setItem('jobSeekerId', jobSeekerId);
        
        // Navigate based on category
        if (category === 'Non-Degree Holder') {
          navigate('/register/non-degree');
        } else {
          navigate('/register/step1');
        }
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
    }
  };

  return (
    <div>
      <h2>Phone Verification</h2>
      {/* Category is hidden - automatically sent in API */}
      {/* User only sees phone input */}
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Enter phone number"
      />
      
      {otpSent && (
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
        />
      )}
      
      {!otpSent ? (
        <button onClick={handleSendOTP}>Send OTP</button>
      ) : (
        <button onClick={handleVerifyOTP}>Verify OTP</button>
      )}
    </div>
  );
}
```

---

## 🔧 Backend Code (How Category is Saved to Database)

### **1. Verify OTP Controller** (`src/controllers/jobSeeker/jobSeeker.controller.js`)

```javascript
export const verifyOTP = asyncHandler(async (req, res) => {
  // ✅ Category is received from frontend request body
  const { phone, otp, category } = req.body;
  // category = "Non-Degree Holder" (from frontend localStorage)

  // Check if user exists
  let jobSeeker = await JobSeeker.findOne({ phone });
  const purpose = jobSeeker ? "login" : "registration";

  // Verify OTP
  const isValid = await verifyOTPFromService(phone, otp, purpose);
  if (!isValid) {
    throw new ApiError(400, "Invalid or expired OTP");
  }
  
  if (!jobSeeker) {
    // ✅ NEW USER - Category is REQUIRED and SAVED TO DATABASE
    if (!category) {
      throw new ApiError(400, "Category is required for new user registration");
    }
    
    // ✅ CREATE NEW JOB SEEKER WITH CATEGORY
    jobSeeker = await JobSeeker.create({
      phone,
      phoneVerified: true,
      category, // ✅ SAVED TO DATABASE HERE
      registrationStep: 1,
    });
    
    // Database record created:
    // {
    //   _id: "...",
    //   phone: "9876543210",
    //   phoneVerified: true,
    //   category: "Non-Degree Holder", ✅ SAVED
    //   registrationStep: 1,
    //   ...
    // }
    
  } else {
    // Existing user - Update category if provided
    jobSeeker.phoneVerified = true;
    
    if (category) {
      jobSeeker.category = category; // ✅ UPDATE CATEGORY IN DATABASE
      if (jobSeeker.registrationStep > 1) {
        jobSeeker.registrationStep = 1;
      }
    }
    
    await jobSeeker.save(); // ✅ SAVE TO DATABASE
  }

  return res
    .status(200)
    .json(
      ApiResponse.success(
        { jobSeeker }, // Returns job seeker with category saved
        "OTP verified successfully"
      )
    );
});
```

---

### **2. Job Seeker Model** (`src/models/jobSeeker/jobSeeker.model.js`)

```javascript
const jobSeekerSchema = new Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    // ✅ CATEGORY FIELD IN DATABASE
    category: {
      type: String,
      enum: ["Non-Degree Holder", "Diploma Holder", "ITI Holder"],
      required: true, // ✅ Required field
    },
    // ... other fields
  },
  { timestamps: true }
);

// When JobSeeker.create() or jobSeeker.save() is called,
// the category is automatically saved to MongoDB database
```

---

### **3. Registration Uses Saved Category**

```javascript
// When user tries to register, backend checks the saved category
export const registerNonDegree = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  // Find job seeker (category already saved in database from verify-otp)
  let jobSeeker = await JobSeeker.findOne({ phone });
  
  // ✅ CATEGORY IS AUTOMATICALLY RETRIEVED FROM DATABASE
  // jobSeeker.category = "Non-Degree Holder" (from database)
  
  if (jobSeeker.category !== "Non-Degree Holder") {
    throw new ApiError(400, "Invalid category for this registration");
  }
  
  // Continue with registration...
});
```

---

## 🔄 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Category Selection                                │
│ User clicks "Non-Degree Holder" card                        │
│ → localStorage.setItem('selectedCategory', 'Non-Degree Holder')│
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Phone Verification                                │
│ const category = localStorage.getItem('selectedCategory');  │
│ → category = "Non-Degree Holder"                           │
│                                                              │
│ API Call: POST /api/job-seekers/verify-otp                 │
│ Body: {                                                     │
│   phone: "9876543210",                                      │
│   otp: "1234",                                             │
│   category: category // ✅ From localStorage               │
│ }                                                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: Verify OTP Controller                             │
│ const { phone, otp, category } = req.body;                  │
│ → category = "Non-Degree Holder" (from request)            │
│                                                              │
│ jobSeeker = await JobSeeker.create({                        │
│   phone,                                                    │
│   phoneVerified: true,                                      │
│   category, // ✅ SAVED TO DATABASE                         │
│   registrationStep: 1                                       │
│ });                                                         │
│                                                              │
│ ✅ Category is now in MongoDB database                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: Registration                                        │
│ jobSeeker = await JobSeeker.findOne({ phone });            │
│ → jobSeeker.category = "Non-Degree Holder" (from database) │
│                                                              │
│ if (jobSeeker.category !== "Non-Degree Holder") {          │
│   throw error;                                              │
│ }                                                           │
│                                                              │
│ ✅ Uses category from database to validate                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Key Code Points

### **Frontend (Automatic Fetch)**
```javascript
// ✅ Automatically get category from localStorage
const category = localStorage.getItem('selectedCategory');

// ✅ Automatically include in API call
body: JSON.stringify({
  phone: phone,
  otp: otp,
  category: category // Auto-filled
})
```

### **Backend (Save to Database)**
```javascript
// ✅ Receive category from request
const { phone, otp, category } = req.body;

// ✅ Save to database
jobSeeker = await JobSeeker.create({
  phone,
  phoneVerified: true,
  category, // ✅ SAVED TO DATABASE
  registrationStep: 1,
});
```

### **Backend (Retrieve from Database)**
```javascript
// ✅ Category is automatically retrieved from database
jobSeeker = await JobSeeker.findOne({ phone });
// jobSeeker.category = "Non-Degree Holder" (from database)

// ✅ Use category for validation
if (jobSeeker.category !== "Non-Degree Holder") {
  throw new ApiError(400, "Invalid category");
}
```

---

## ✅ Summary

1. **Frontend**: Category stored in localStorage when user selects it
2. **Frontend**: Category automatically retrieved from localStorage in API calls
3. **Backend**: Category received in request body
4. **Backend**: Category saved to MongoDB database in `verifyOTP` function
5. **Backend**: Category retrieved from database in registration functions

The category flows: **localStorage → API Request → Database → Registration Validation**

