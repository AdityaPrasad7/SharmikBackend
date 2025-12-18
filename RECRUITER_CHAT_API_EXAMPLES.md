# Recruiter Chat API - Request & Response Examples

## Base URL
All endpoints: `/api/chat/recruiters/`

## Authentication
All endpoints require:
```
Authorization: Bearer <recruiter_jwt_token>
```

---

## 1. Send Message (Initiate/Reply to Conversation)

**Endpoint:** `POST /api/chat/recruiters/send-message`

### Request Headers
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

### Request Body
```json
{
  "applicationId": "69257b019fcd943c6a59efba",
  "content": "Hello! Thank you for applying to our position. I'd like to schedule an interview with you.",
  "messageType": "text"
}
```

**Field Descriptions:**
- `applicationId` (required): MongoDB ObjectId of the application
- `content` (required): Message text (1-5000 characters)
- `messageType` (optional): "text" | "file" | "image" (default: "text")

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "_id": "69260a1b2c3d4e5f6a7b8c9d",
      "conversation": "69260a1b2c3d4e5f6a7b8c9e",
      "sender": "recruiter",
      "senderId": {
        "_id": "69202ae0846a80312a300f79",
        "companyName": "Tech Solutions Pvt Ltd",
        "companyLogo": "https://res.cloudinary.com/du0w84p1k/image/upload/v1763114032/shramik/documents/logo.jpg"
      },
      "content": "Hello! Thank you for applying to our position. I'd like to schedule an interview with you.",
      "messageType": "text",
      "isRead": false,
      "attachments": [],
      "createdAt": "2025-01-25T10:30:00.000Z",
      "updatedAt": "2025-01-25T10:30:00.000Z"
    }
  },
  "meta": null
}
```

### Error Responses

**400 Bad Request - Validation Error**
```json
{
  "success": false,
  "message": "Application ID is required, Message content cannot be empty",
  "data": null,
  "meta": null
}
```

**403 Forbidden - Not Authorized**
```json
{
  "success": false,
  "message": "You are not authorized to chat for this application",
  "data": null,
  "meta": null
}
```

**404 Not Found - Application Not Found**
```json
{
  "success": false,
  "message": "Application not found",
  "data": null,
  "meta": null
}
```

---

## 2. Get Messages (Get Conversation Messages)

**Endpoint:** `GET /api/chat/recruiters/messages/:applicationId`

### Request Headers
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Query Parameters
```
?page=1&limit=20
```

**Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Messages per page (default: 20, min: 1, max: 100)

### Example Request
```
GET /api/chat/recruiters/messages/69257b019fcd943c6a59efba?page=1&limit=20
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Messages fetched successfully",
  "data": {
    "messages": [
      {
        "_id": "69260a1b2c3d4e5f6a7b8c9d",
        "conversation": "69260a1b2c3d4e5f6a7b8c9e",
        "sender": "recruiter",
        "senderId": {
          "_id": "69202ae0846a80312a300f79",
          "companyName": "Tech Solutions Pvt Ltd",
          "companyLogo": "https://res.cloudinary.com/du0w84p1k/image/upload/v1763114032/shramik/documents/logo.jpg"
        },
        "content": "Hello! Thank you for applying to our position.",
        "messageType": "text",
        "isRead": true,
        "attachments": [],
        "createdAt": "2025-01-25T10:30:00.000Z",
        "updatedAt": "2025-01-25T10:30:00.000Z"
      },
      {
        "_id": "69260a1b2c3d4e5f6a7b8c9f",
        "conversation": "69260a1b2c3d4e5f6a7b8c9e",
        "sender": "job-seeker",
        "senderId": {
          "_id": "691c12c4a25813167ed5a783",
          "name": "John Doe",
          "profilePhoto": "https://res.cloudinary.com/du0w84p1k/image/upload/v1763114032/shramik/documents/profile.jpg"
        },
        "content": "Thank you! I'm very interested in this position.",
        "messageType": "text",
        "isRead": true,
        "attachments": [],
        "createdAt": "2025-01-25T10:35:00.000Z",
        "updatedAt": "2025-01-25T10:35:00.000Z"
      },
      {
        "_id": "69260a1b2c3d4e5f6a7b8ca0",
        "conversation": "69260a1b2c3d4e5f6a7b8c9e",
        "sender": "recruiter",
        "senderId": {
          "_id": "69202ae0846a80312a300f79",
          "companyName": "Tech Solutions Pvt Ltd",
          "companyLogo": "https://res.cloudinary.com/du0w84p1k/image/upload/v1763114032/shramik/documents/logo.jpg"
        },
        "content": "Great! When would be a good time for you?",
        "messageType": "text",
        "isRead": true,
        "attachments": [],
        "createdAt": "2025-01-25T10:40:00.000Z",
        "updatedAt": "2025-01-25T10:40:00.000Z"
      }
    ],
    "conversation": {
      "_id": "69260a1b2c3d4e5f6a7b8c9e",
      "application": "69257b019fcd943c6a59efba",
      "job": {
        "_id": "69204695212bb08086bff2dd",
        "jobTitle": "Senior Software Developer",
        "jobDescription": "We are looking for an experienced software developer..."
      },
      "recruiter": {
        "_id": "69202ae0846a80312a300f79",
        "companyName": "Tech Solutions Pvt Ltd",
        "companyLogo": "https://res.cloudinary.com/du0w84p1k/image/upload/v1763114032/shramik/documents/logo.jpg"
      },
      "jobSeeker": {
        "_id": "691c12c4a25813167ed5a783",
        "name": "John Doe",
        "profilePhoto": "https://res.cloudinary.com/du0w84p1k/image/upload/v1763114032/shramik/documents/profile.jpg"
      },
      "initiatedBy": "recruiter",
      "lastMessage": "Great! When would be a good time for you?",
      "lastMessageAt": "2025-01-25T10:40:00.000Z",
      "lastMessageBy": "recruiter",
      "unreadCountRecruiter": 0,
      "unreadCountJobSeeker": 0,
      "status": "active",
      "createdAt": "2025-01-25T10:30:00.000Z",
      "updatedAt": "2025-01-25T10:40:00.000Z"
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalMessages": 3,
      "limit": 20,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  },
  "meta": null
}
```

### Success Response - No Conversation Exists (200 OK)
```json
{
  "success": true,
  "message": "No conversation found",
  "data": {
    "messages": [],
    "conversation": null,
    "pagination": {
      "currentPage": 1,
      "totalPages": 0,
      "totalMessages": 0,
      "limit": 20,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  },
  "meta": null
}
```

### Error Responses

**400 Bad Request - Invalid Application ID**
```json
{
  "success": false,
  "message": "Invalid application ID format",
  "data": null,
  "meta": null
}
```

**403 Forbidden - Not Authorized**
```json
{
  "success": false,
  "message": "You are not authorized to access this conversation",
  "data": null,
  "meta": null
}
```

**404 Not Found - Application Not Found**
```json
{
  "success": false,
  "message": "Application not found",
  "data": null,
  "meta": null
}
```

---

## 3. Get All Conversations (List Conversations)

**Endpoint:** `GET /api/chat/recruiters/conversations`

### Request Headers
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Query Parameters
```
?page=1&limit=20&status=active
```

**Parameters:**
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Conversations per page (default: 20, min: 1, max: 50)
- `status` (optional): Filter by status - "active" | "archived" (default: "active")

### Example Request
```
GET /api/chat/recruiters/conversations?page=1&limit=20&status=active
```

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Conversations fetched successfully",
  "data": {
    "conversations": [
      {
        "_id": "69260a1b2c3d4e5f6a7b8c9e",
        "application": {
          "_id": "69257b019fcd943c6a59efba",
          "status": "Pending",
          "coverLetter": "I am very interested in this position..."
        },
        "job": {
          "_id": "69204695212bb08086bff2dd",
          "jobTitle": "Senior Software Developer",
          "jobDescription": "We are looking for an experienced software developer...",
          "city": "Mumbai",
          "expectedSalary": {
            "min": 50000,
            "max": 80000,
            "currency": "INR",
            "payPeriod": "monthly"
          }
        },
        "recruiter": {
          "_id": "69202ae0846a80312a300f79",
          "companyName": "Tech Solutions Pvt Ltd",
          "companyLogo": "https://res.cloudinary.com/du0w84p1k/image/upload/v1763114032/shramik/documents/logo.jpg"
        },
        "jobSeeker": {
          "_id": "691c12c4a25813167ed5a783",
          "name": "John Doe",
          "profilePhoto": "https://res.cloudinary.com/du0w84p1k/image/upload/v1763114032/shramik/documents/profile.jpg"
        },
        "initiatedBy": "recruiter",
        "lastMessage": "Great! When would be a good time for you?",
        "lastMessageAt": "2025-01-25T10:40:00.000Z",
        "lastMessageBy": "recruiter",
        "unreadCount": 0,
        "status": "active",
        "createdAt": "2025-01-25T10:30:00.000Z",
        "updatedAt": "2025-01-25T10:40:00.000Z"
      },
      {
        "_id": "69260a1b2c3d4e5f6a7b8ca1",
        "application": {
          "_id": "69257af59fcd943c6a59efa7",
          "status": "Shortlisted",
          "coverLetter": "I have 5 years of experience..."
        },
        "job": {
          "_id": "692046b0212bb08086bff2e2",
          "jobTitle": "Frontend Developer",
          "jobDescription": "Looking for a skilled frontend developer...",
          "city": "Bangalore",
          "expectedSalary": {
            "min": 40000,
            "max": 70000,
            "currency": "INR",
            "payPeriod": "monthly"
          }
        },
        "recruiter": {
          "_id": "69202ae0846a80312a300f79",
          "companyName": "Tech Solutions Pvt Ltd",
          "companyLogo": "https://res.cloudinary.com/du0w84p1k/image/upload/v1763114032/shramik/documents/logo.jpg"
        },
        "jobSeeker": {
          "_id": "691c12c4a25813167ed5a784",
          "name": "Jane Smith",
          "profilePhoto": "https://res.cloudinary.com/du0w84p1k/image/upload/v1763114032/shramik/documents/profile2.jpg"
        },
        "initiatedBy": "recruiter",
        "lastMessage": "Thank you for your interest!",
        "lastMessageAt": "2025-01-25T09:15:00.000Z",
        "lastMessageBy": "job-seeker",
        "unreadCount": 2,
        "status": "active",
        "createdAt": "2025-01-25T09:00:00.000Z",
        "updatedAt": "2025-01-25T09:15:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalConversations": 2,
      "limit": 20,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  },
  "meta": null
}
```

### Success Response - No Conversations (200 OK)
```json
{
  "success": true,
  "message": "Conversations fetched successfully",
  "data": {
    "conversations": [],
    "pagination": {
      "currentPage": 1,
      "totalPages": 0,
      "totalConversations": 0,
      "limit": 20,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  },
  "meta": null
}
```

### Error Responses

**400 Bad Request - Invalid Query Parameters**
```json
{
  "success": false,
  "message": "Status must be one of: active, archived",
  "data": null,
  "meta": null
}
```

---

## 4. Mark Messages as Read

**Endpoint:** `PUT /api/chat/recruiters/mark-read`

### Request Headers
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

### Request Body
```json
{
  "applicationId": "69257b019fcd943c6a59efba"
}
```

**Field Descriptions:**
- `applicationId` (required): MongoDB ObjectId of the application

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Messages marked as read successfully",
  "data": {
    "markedCount": 5
  },
  "meta": null
}
```

### Error Responses

**400 Bad Request - Validation Error**
```json
{
  "success": false,
  "message": "Application ID is required",
  "data": null,
  "meta": null
}
```

**403 Forbidden - Not Authorized**
```json
{
  "success": false,
  "message": "You are not authorized to access this conversation",
  "data": null,
  "meta": null
}
```

**404 Not Found - Conversation Not Found**
```json
{
  "success": false,
  "message": "Conversation not found",
  "data": null,
  "meta": null
}
```

---

## 5. Archive Conversation

**Endpoint:** `PUT /api/chat/recruiters/archive`

### Request Headers
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "Content-Type": "application/json"
}
```

### Request Body
```json
{
  "applicationId": "69257b019fcd943c6a59efba"
}
```

**Field Descriptions:**
- `applicationId` (required): MongoDB ObjectId of the application

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Conversation archived successfully",
  "data": {
    "conversation": {
      "_id": "69260a1b2c3d4e5f6a7b8c9e",
      "application": "69257b019fcd943c6a59efba",
      "job": "69204695212bb08086bff2dd",
      "recruiter": "69202ae0846a80312a300f79",
      "jobSeeker": "691c12c4a25813167ed5a783",
      "initiatedBy": "recruiter",
      "lastMessage": "Great! When would be a good time for you?",
      "lastMessageAt": "2025-01-25T10:40:00.000Z",
      "lastMessageBy": "recruiter",
      "unreadCountRecruiter": 0,
      "unreadCountJobSeeker": 0,
      "status": "archived",
      "createdAt": "2025-01-25T10:30:00.000Z",
      "updatedAt": "2025-01-25T11:00:00.000Z"
    }
  },
  "meta": null
}
```

### Error Responses

**400 Bad Request - Validation Error**
```json
{
  "success": false,
  "message": "Application ID is required",
  "data": null,
  "meta": null
}
```

**403 Forbidden - Not Authorized**
```json
{
  "success": false,
  "message": "You are not authorized to access this conversation",
  "data": null,
  "meta": null
}
```

**404 Not Found - Conversation Not Found**
```json
{
  "success": false,
  "message": "Conversation not found",
  "data": null,
  "meta": null
}
```

---

## Common Error Responses

### 401 Unauthorized - Missing/Invalid Token
```json
{
  "success": false,
  "message": "Unauthorized: No access token provided",
  "data": null,
  "meta": null
}
```

### 401 Unauthorized - Token Expired
```json
{
  "success": false,
  "message": "Access token expired. Please refresh your token.",
  "data": null,
  "meta": null
}
```

### 401 Unauthorized - Invalid Token
```json
{
  "success": false,
  "message": "Invalid access token",
  "data": null,
  "meta": null
}
```

### 403 Forbidden - Inactive Account
```json
{
  "success": false,
  "message": "Account is inactive. Please contact support.",
  "data": null,
  "meta": null
}
```

---

## Notes

1. **Conversation Initiation**: Only recruiters can initiate conversations. The first message from a recruiter automatically creates the conversation.

2. **Auto-Read**: When fetching messages, all unread messages are automatically marked as read for the fetching user.

3. **Unread Count**: The `unreadCount` in conversations list shows unread messages for the recruiter. This is automatically updated when messages are sent/received.

4. **Archived Conversations**: Archived conversations can be restored by sending a new message, which will change status back to "active".

5. **Message Ordering**: Messages are returned in chronological order (oldest first) within each page.

6. **Pagination**: All list endpoints support pagination. Use `page` and `limit` query parameters to navigate through results.

7. **Status Filter**: When fetching conversations, you can filter by `status=active` or `status=archived`. Default is "active".




