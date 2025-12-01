# Chat API Documentation

## Overview
The Chat API allows recruiters and job seekers to communicate after a job application has been submitted. Only recruiters can initiate conversations, but both parties can send messages once a conversation exists.

## Folder Structure
```
shramikBackend/src/
├── models/
│   └── chat/
│       ├── conversation.model.js    # Conversation model (one per application)
│       └── message.model.js        # Individual messages
├── controllers/
│   └── chat/
│       └── chat.controller.js      # Unified controller for both user types
├── routes/
│   └── chat/
│       └── chat.routes.js          # Chat routes for both user types
├── middlewares/
│   └── chat/
│       └── validateChat.js         # Validation middleware
└── validation/
    └── chat/
        └── chat.validation.js    # Joi validation schemas
```

## Models

### Conversation Model
- Links a conversation between recruiter and job seeker for a specific application
- One conversation per application (unique constraint)
- Tracks unread message counts for both participants
- Stores last message info for quick access

### Message Model
- Individual messages in a conversation
- Tracks sender type (recruiter or job-seeker)
- Supports read/unread status
- Supports different message types (text, file, image)

## API Endpoints

### Base URL
All chat endpoints are prefixed with `/api/chat`

### Recruiter Endpoints

#### 1. Send Message
**POST** `/api/chat/recruiters/send-message`

**Headers:**
```
Authorization: Bearer <recruiter_jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "applicationId": "application_id_here",
  "content": "Hello, I'd like to discuss your application.",
  "messageType": "text" // optional, default: "text"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "message": {
      "_id": "message_id",
      "conversation": "conversation_id",
      "sender": "recruiter",
      "senderId": {
        "_id": "recruiter_id",
        "companyName": "Company Name",
        "companyLogo": "logo_url"
      },
      "content": "Hello, I'd like to discuss your application.",
      "messageType": "text",
      "isRead": false,
      "attachments": [],
      "createdAt": "2025-01-25T10:00:00.000Z",
      "updatedAt": "2025-01-25T10:00:00.000Z"
    }
  }
}
```

#### 2. Get Messages
**GET** `/api/chat/recruiters/messages/:applicationId?page=1&limit=20`

**Headers:**
```
Authorization: Bearer <recruiter_jwt_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Messages per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "message": "Messages fetched successfully",
  "data": {
    "messages": [
      {
        "_id": "message_id",
        "conversation": "conversation_id",
        "sender": "recruiter",
        "senderId": {...},
        "content": "Message content",
        "messageType": "text",
        "isRead": true,
        "attachments": [],
        "createdAt": "2025-01-25T10:00:00.000Z",
        "updatedAt": "2025-01-25T10:00:00.000Z"
      }
    ],
    "conversation": {
      "_id": "conversation_id",
      "application": "application_id",
      "job": {...},
      "recruiter": {...},
      "jobSeeker": {...},
      "initiatedBy": "recruiter",
      "lastMessage": "Last message preview",
      "lastMessageAt": "2025-01-25T10:00:00.000Z",
      "lastMessageBy": "recruiter",
      "unreadCountRecruiter": 0,
      "unreadCountJobSeeker": 2,
      "status": "active",
      "createdAt": "2025-01-25T09:00:00.000Z",
      "updatedAt": "2025-01-25T10:00:00.000Z"
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalMessages": 5,
      "limit": 20,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

#### 3. Get All Conversations
**GET** `/api/chat/recruiters/conversations?page=1&limit=20&status=active`

**Headers:**
```
Authorization: Bearer <recruiter_jwt_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Conversations per page (default: 20, max: 50)
- `status` (optional): Filter by status - "active" or "archived" (default: "active")

**Response:**
```json
{
  "success": true,
  "message": "Conversations fetched successfully",
  "data": {
    "conversations": [
      {
        "_id": "conversation_id",
        "application": {...},
        "job": {...},
        "recruiter": {...},
        "jobSeeker": {...},
        "initiatedBy": "recruiter",
        "lastMessage": "Last message preview",
        "lastMessageAt": "2025-01-25T10:00:00.000Z",
        "lastMessageBy": "recruiter",
        "unreadCount": 2,
        "status": "active",
        "createdAt": "2025-01-25T09:00:00.000Z",
        "updatedAt": "2025-01-25T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalConversations": 5,
      "limit": 20,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

#### 4. Mark Messages as Read
**PUT** `/api/chat/recruiters/mark-read`

**Headers:**
```
Authorization: Bearer <recruiter_jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "applicationId": "application_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Messages marked as read successfully",
  "data": {
    "markedCount": 5
  }
}
```

#### 5. Archive Conversation
**PUT** `/api/chat/recruiters/archive`

**Headers:**
```
Authorization: Bearer <recruiter_jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "applicationId": "application_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Conversation archived successfully",
  "data": {
    "conversation": {...}
  }
}
```

### Job Seeker Endpoints

All job seeker endpoints follow the same pattern as recruiter endpoints, but with `/job-seekers/` prefix:

- **POST** `/api/chat/job-seekers/send-message`
- **GET** `/api/chat/job-seekers/messages/:applicationId`
- **GET** `/api/chat/job-seekers/conversations`
- **PUT** `/api/chat/job-seekers/mark-read`
- **PUT** `/api/chat/job-seekers/archive`

**Note:** Job seekers can only send messages after a recruiter has initiated the conversation.

## Business Rules

1. **Conversation Initiation:**
   - Only recruiters can initiate a conversation
   - One conversation per application (enforced by unique constraint)
   - Conversation is automatically created when recruiter sends first message

2. **Message Sending:**
   - Both recruiter and job seeker can send messages once conversation exists
   - Messages are automatically marked as read for the sender
   - Unread count is incremented for the recipient

3. **Message Reading:**
   - When fetching messages, all unread messages are automatically marked as read
   - Unread count is reset to 0 for the fetching user

4. **Conversation Status:**
   - `active`: Normal conversation state
   - `archived`: User has archived the conversation (can be restored by sending a message)
   - `deleted`: Soft delete (not currently used in API)

5. **Authorization:**
   - Users can only access conversations related to their own applications
   - Recruiters can only access conversations for jobs they posted
   - Job seekers can only access conversations for their own applications

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation error messages",
  "data": null
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized: No access token provided",
  "data": null
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "You are not authorized to access this conversation",
  "data": null
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Application not found",
  "data": null
}
```

## Example Flow

1. **Job Seeker applies for a job** → Application created
2. **Recruiter sends first message** → Conversation created automatically
3. **Job Seeker receives notification** → Can now reply
4. **Both parties exchange messages** → Messages stored with timestamps
5. **Messages marked as read** → When recipient fetches messages
6. **Conversation can be archived** → By either party

## Notes

- Messages are stored with timestamps for chronological ordering
- Unread counts are maintained per conversation per user
- Conversations are sorted by last message time (most recent first)
- Messages are paginated for performance
- All endpoints require authentication
- File attachments support is prepared but not fully implemented (messageType: "file" or "image")



