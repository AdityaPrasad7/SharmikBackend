# Cloudinary Setup Guide

## ✅ What Changed

Your file upload system has been migrated from local file storage to **Cloudinary** to work with Vercel's serverless functions.

### **Before (Local Storage)**
- Files saved to `uploads/` directory
- Not compatible with Vercel (read-only filesystem)

### **After (Cloudinary)**
- Files uploaded directly to Cloudinary
- Works perfectly with Vercel serverless functions
- Files accessible via Cloudinary CDN URLs

---

## 🚀 Setup Steps

### **Step 1: Create Cloudinary Account**

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up for a free account (includes 25GB storage and 25GB bandwidth/month)
3. Verify your email address

### **Step 2: Get Your Cloudinary Credentials**

1. After logging in, go to your **Dashboard**
2. You'll see your **Cloudinary credentials**:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### **Step 3: Add Environment Variables**

#### **Local Development (.env file)**

Add these to your `.env` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### **Vercel Deployment**

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these three variables:
   - `CLOUDINARY_CLOUD_NAME` = `your_cloud_name`
   - `CLOUDINARY_API_KEY` = `your_api_key`
   - `CLOUDINARY_API_SECRET` = `your_api_secret`
4. Make sure to add them for **Production**, **Preview**, and **Development** environments

---

## 📁 File Organization in Cloudinary

Files are organized in Cloudinary folders:

```
shramik/
├── aadhaar/          (Aadhaar card uploads)
├── profile/          (Profile photo uploads)
├── resume/           (Resume uploads)
├── experience/       (Experience certificate uploads)
└── documents/        (Other document uploads)
```

---

## 🔧 How It Works

### **1. File Upload Flow**

```
Client → Multer (Memory Storage) → Cloudinary Upload → Save URL to Database
```

1. **Multer** receives file in memory (no disk write)
2. **Cloudinary middleware** uploads file to Cloudinary
3. **Cloudinary URL** is stored in database (not file path)

### **2. File URL Format**

Files are stored with Cloudinary URLs like:
```
https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/shramik/aadhaar/filename.jpg
```

### **3. Database Storage**

Instead of storing file paths like:
```json
{
  "aadhaarCard": "uploads/aadhaar/file.jpg"
}
```

Now stores Cloudinary URLs:
```json
{
  "aadhaarCard": "https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/shramik/aadhaar/file.jpg"
}
```

---

## ✅ Testing

### **1. Test File Upload**

Use Postman to test file upload:

```bash
POST http://localhost:8000/api/job-seekers/register/step1
Content-Type: multipart/form-data

Form-Data:
  phone: 9876543210
  aadhaarCard: [FILE]
  profilePhoto: [FILE]
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Step 1 completed successfully",
  "data": {
    "jobSeeker": {
      "aadhaarCard": "https://res.cloudinary.com/...",
      "profilePhoto": "https://res.cloudinary.com/..."
    }
  }
}
```

### **2. Verify in Cloudinary Dashboard**

1. Go to Cloudinary Dashboard → **Media Library**
2. Navigate to `shramik/` folder
3. You should see your uploaded files

---

## 🔒 Security Best Practices

### **1. Protect Your API Secret**

- ✅ Never commit `.env` file to Git
- ✅ Never expose API Secret in frontend code
- ✅ Use environment variables in Vercel

### **2. Cloudinary Security Settings**

1. Go to **Settings** → **Security**
2. Enable **Restricted media types** (optional)
3. Set up **Upload presets** for specific use cases (optional)
4. Configure **Allowed file formats** (optional)

### **3. Upload Restrictions**

The code already includes:
- ✅ File type validation (images, PDFs, Word docs)
- ✅ File size limit (10MB)
- ✅ Organized folder structure

---

## 📊 Cloudinary Free Tier Limits

- **Storage**: 25GB
- **Bandwidth**: 25GB/month
- **Transformations**: Unlimited
- **Uploads**: Unlimited

**Note**: For production with high traffic, consider upgrading to a paid plan.

---

## 🐛 Troubleshooting

### **Error: "Invalid cloud_name"**

**Solution**: Check your `CLOUDINARY_CLOUD_NAME` environment variable

### **Error: "Invalid API key"**

**Solution**: Verify `CLOUDINARY_API_KEY` is correct

### **Error: "Invalid signature"**

**Solution**: Check `CLOUDINARY_API_SECRET` is set correctly

### **Error: "File upload failed"**

**Possible causes**:
- Network connectivity issues
- File size exceeds 10MB limit
- Invalid file type
- Cloudinary service outage

**Solution**: Check Cloudinary status and file requirements

### **Files not appearing in Cloudinary**

**Solution**: 
- Check Cloudinary dashboard → Media Library
- Verify environment variables are set correctly
- Check server logs for upload errors

---

## 🔄 Migration from Local Files

If you have existing files in the `uploads/` directory:

1. **Option 1**: Keep them as-is (they'll still work if URLs are stored in DB)
2. **Option 2**: Upload them to Cloudinary manually:
   - Go to Cloudinary Dashboard → Media Library
   - Click "Upload" and upload files to appropriate folders
   - Update database URLs if needed

---

## 📚 Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)
- [Cloudinary Upload API](https://cloudinary.com/documentation/upload_images)

---

## ✅ Checklist

- [ ] Created Cloudinary account
- [ ] Got Cloudinary credentials (Cloud Name, API Key, API Secret)
- [ ] Added environment variables to `.env` file
- [ ] Added environment variables to Vercel
- [ ] Tested file upload locally
- [ ] Verified files appear in Cloudinary dashboard
- [ ] Tested file upload on Vercel deployment

---

**Your file upload system is now ready for Vercel! 🚀**

