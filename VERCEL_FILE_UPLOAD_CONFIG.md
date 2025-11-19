# Vercel File Upload Configuration

## Problem
Getting error: `Invalid file type. Allowed types: image/jpeg, image/jpg, image/png`

## Solution

The file upload middleware now supports accepting **all file types** via an environment variable.

### Option 1: Accept All File Types (Recommended for Mobile Apps)

**In Vercel Dashboard:**
1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add a new variable:
   - **Name:** `ACCEPT_ALL_FILES`
   - **Value:** `true`
   - **Environment:** Production, Preview, Development (select all)

**Or via Vercel CLI:**
```bash
vercel env add ACCEPT_ALL_FILES
# Enter: true
```

### Option 2: Use Expanded File Type List (Default)

The middleware now accepts many more file types by default:
- **Images:** JPEG, PNG, GIF, WebP, BMP, TIFF, SVG, HEIC, HEIF
- **Documents:** PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, RTF, TXT, CSV
- **Archives:** ZIP, RAR, 7Z
- **Generic:** application/octet-stream (fallback)

If your file type is still not accepted, use Option 1 to accept all files.

## After Setting Environment Variable

1. **Redeploy** your Vercel project (or wait for auto-deploy)
2. Test the file upload again
3. The error should be resolved

## Security Note

Accepting all file types (`ACCEPT_ALL_FILES=true`) is convenient but less secure. Consider:
- File size limits are still enforced (10MB default)
- Cloudinary will still validate files on upload
- You can add additional validation in your controllers if needed

## Current Configuration

- **File Size Limit:** 10MB (configurable in `fileUpload.js`)
- **Storage:** Memory (files uploaded directly to Cloudinary)
- **File Filter:** Configurable via `ACCEPT_ALL_FILES` env variable




