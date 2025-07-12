# StackIt Backend API

A Node.js/Express.js backend API for the StackIt Q&A platform with MongoDB and Firebase integration.

## Features

- 🔐 **Firebase Authentication** - Secure user authentication with ID token verification
- 📝 **Questions & Answers** - Full CRUD operations with voting system
- 🏷️ **Tags Management** - Tag-based categorization and search
- 🔔 **Real-time Notifications** - Socket.IO integration for live updates
- 👥 **User Profiles** - User management with reputation system
- 📊 **Advanced Search** - Full-text search with filters and pagination
- 🛡️ **Security** - Rate limiting, input validation, and sanitization

## Tech Stack

- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase Admin SDK
- **Real-time**: Socket.IO
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## Quick Start

### 1. Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Firebase project with Admin SDK

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd backend

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit environment variables
nano .env
```

### 3. Environment Configuration

Update `.env` with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/stackit

# Firebase Admin Configuration
FIREBASE_PROJECT_ID=stackit-32eff
FIREBASE_PRIVATE_KEY_ID=d173c3a6ac5bb9046b8b0112b2510d69bd1f9b33
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC/c+LZEt/c2yMV\nMk2KL6xdZ26XjyV4QyRQQT6893xJhTfdCTheMMqSa/k4P2PWIbXEEcdjR8wgI6ij\niZFKLgU6wR3B/5cAV9kqxrW79bTP0AAGDnMWgvTDSRpFRc7Fwe58AgXzuqEMc44b\ncQaCl2qCw3x5N4185uKI86b/S30spJ3W3NWqgi2vzxMF8QnofPoHHL9K4NUgs5Df\nJNdg6w94zgHXUmOixbfECl6MbIAzd4G3Cf8xZvJlE1o5KtRLPEusrjpolyn8rOFw\nsEE2T82qus3PvjbLjMpAkFb7BbRZ9yfeXurwLymY1TEBWtXILWB1W4R82C5DC4Pp\nqEXQTZRVAgMBAAECggEAP33JD0ApKW8q9U6XVGp2+QriLDT2siliE5NvoO9aMm+R\nlSYHoYUAyQoxviuXil3nj7xtqUkYMthghsuKeVVFurRsj/eZNi3sATmg71KOwhQy\nzc9g72hCj7jgk3SRHBgyZMGvA6My4ZQ43nTfOdPJKNB3qSN5MqDHI6/aA/Qe8Pya\n0i24iImj4TqJ/vzpucJAaIhXpF9pkO4YezSiiUWYbkVtutaBK7nfMSYdXH71noTT\nRDgjDO/WWWuCCtT05mFBOowerhpF41sVzG8U2wdisxDMM6SUtdhlTV8ZzEnv4YQ1\nDd5H866K3QjNLO2e0KE335Y8JoT6dhBExDirYsopSQKBgQD5YeoNtwjVzp73pN5d\nE9XBIAcjyubcxaGg+c0mQalJPMXtkUrR1IzDaDe7epQpIaSiz9q3nDX8BEHvRz+N\ndVMjqXD6W9QhVKtGidIEVe12PARJolTZJbAhttgEqoGRolS8T/cKonGY6ekhEGoe\nGm97Kg6HYVXT8jCp5B08F+rM8wKBgQDEiHKYkuLOOPtk7nRoMxiCNF4vqyUg2N8V\nUEHVYNbxvzOjGZLdhE9k4ZE2LfIKQStO7jY82fgIPlrh6Bt6h1gwDFEMMnFWGCcA\nOoK5nMtvXJRd0gvQiHj/EVAEuR1mK0cInRcHXM++xFD6+masWDQyISGlWL7cUVdL\n5KPNNQ7LlwKBgQCm1f6DVmQuxaBMBJxOoKpsHUUpiOCR6hWLYBMC+QKL4IB5wq3P\nWuchA2PlpMfiDIPb+DpWg8cJ5r9FmODHfio0vXK7yxtLgR1kf2dlRycp5lTn/hXN\ngA0pQO2bkYZFK9iMcuLO1oYwyqwQVq7nnL/gIe6+WzvUIz6zKcz1GvsWSQKBgQCc\noLnjiryi6ZrAt6GiIYaYzi96AgWXBf/UNqAg9AqZo239wDXhwL6dgX9/FGLfdUyU\nnRgwqu4Xc8puW9L6db78m/RDqjfVC26Zqgfg8WrYF4pOs0WjLgBwF1YUTYt2j2sP\nHFLsFTWjrUV0n/cPx0Ph57Gu2ulRIKpX26IHuw9NhQKBgFnrOKV91ULePF4OKlwN\nCMo4hHc5N9d43zVlqu7mfd+hoboLjJzsiES5hZ6DvNpUeT7slzbN0TVMguh0NI1c\nlqUioJ70GDtHX+oghb4jyRkQMHAQo9OtbwZfS7yNQLuI1ewHmqGJCXwK+z7eUg83\nTqqMT/wGk7I/ukzx57JmPF2W\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@stackit-32eff.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=115563118387916539622
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40stackit-32eff.iam.gserviceaccount.com

# JWT Secret (for additional security if needed)


# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100 
```

### 4. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Go to Project Settings > Service Accounts
4. Generate new private key
5. Copy the configuration to your `.env` file

### 5. Run the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication

All protected endpoints require a Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

### Questions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/questions` | List questions with filters | No |
| GET | `/api/questions/:id` | Get question details | No |
| POST | `/api/questions` | Create new question | Yes |
| PUT | `/api/questions/:id` | Update question | Yes (owner) |
| DELETE | `/api/questions/:id` | Delete question | Yes (owner) |
| POST | `/api/questions/:id/vote` | Vote on question | Yes |
| POST | `/api/questions/:id/accept` | Accept answer | Yes (owner) |

### Answers

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/answers/question/:questionId` | Get answers for question | No |
| POST | `/api/answers` | Create new answer | Yes |
| PUT | `/api/answers/:id` | Update answer | Yes (owner) |
| DELETE | `/api/answers/:id` | Delete answer | Yes (owner) |
| POST | `/api/answers/:id/vote` | Vote on answer | Yes |
| POST | `/api/answers/:id/accept` | Accept answer | Yes (question owner) |

### Tags

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/tags` | List all tags | No |
| GET | `/api/tags/popular` | Get popular tags | No |
| GET | `/api/tags/search` | Search tags | No |
| GET | `/api/tags/:tagName` | Get questions by tag | No |

### Notifications

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/notifications` | Get user notifications | Yes |
| GET | `/api/notifications/unread-count` | Get unread count | Yes |
| POST | `/api/notifications/:id/read` | Mark as read | Yes |
| POST | `/api/notifications/mark-all-read` | Mark all as read | Yes |
| DELETE | `/api/notifications/:id` | Delete notification | Yes |
| DELETE | `/api/notifications` | Delete all notifications | Yes |

### User Profile

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/auth/profile` | Get user profile | Yes |
| PUT | `/api/auth/profile` | Update profile | Yes |
| GET | `/api/auth/users/:userId` | Get public profile | No |
| GET | `/api/auth/users/:userId/questions` | Get user questions | No |
| GET | `/api/auth/users/:userId/answers` | Get user answers | No |

## Request/Response Examples

### Create Question

**Request:**
```http
POST /api/questions
Authorization: Bearer <firebase-id-token>
Content-Type: application/json

{
  "title": "How to implement authentication in Flutter?",
  "content": "I'm building a Flutter app and need to implement user authentication...",
  "tags": ["flutter", "authentication", "firebase"]
}
```

**Response:**
```json
{
  "message": "Question created successfully",
  "question": {
    "id": "507f1f77bcf86cd799439011",
    "title": "How to implement authentication in Flutter?",
    "content": "I'm building a Flutter app and need to implement user authentication...",
    "tags": ["flutter", "authentication", "firebase"],
    "userId": {
      "id": "507f1f77bcf86cd799439012",
      "displayName": "John Doe",
      "avatarUrl": "https://example.com/avatar.jpg"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "voteCount": 0,
    "answerCount": 0,
    "viewCount": 0
  }
}
```

### Get Questions with Filters

**Request:**
```http
GET /api/questions?page=1&limit=10&filter=newest&q=flutter&tag=authentication
```

**Response:**
```json
{
  "questions": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "How to implement authentication in Flutter?",
      "content": "I'm building a Flutter app...",
      "tags": ["flutter", "authentication"],
      "userId": {
        "id": "507f1f77bcf86cd799439012",
        "displayName": "John Doe",
        "avatarUrl": "https://example.com/avatar.jpg"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "voteCount": 5,
      "answerCount": 2,
      "viewCount": 150,
      "userVote": 1
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "hasMore": true
  }
}
```

## Database Schema

### User
```javascript
{
  _id: ObjectId,
  uid: String,           // Firebase UID
  displayName: String,
  email: String,
  avatarUrl: String,
  reputation: Number,
  badges: [String],
  joinDate: Date,
  lastSeen: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Question
```javascript
{
  _id: ObjectId,
  title: String,
  content: String,
  tags: [String],
  userId: ObjectId,      // Reference to User
  votes: [{
    userId: ObjectId,
    vote: Number,         // 1 or -1
    createdAt: Date
  }],
  viewCount: Number,
  answerCount: Number,
  isClosed: Boolean,
  acceptedAnswerId: ObjectId,  // Reference to Answer
  bounty: Number,
  bountyExpiry: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Answer
```javascript
{
  _id: ObjectId,
  questionId: ObjectId,  // Reference to Question
  userId: ObjectId,      // Reference to User
  content: String,
  votes: [{
    userId: ObjectId,
    vote: Number,         // 1 or -1
    createdAt: Date
  }],
  isAccepted: Boolean,
  acceptedAt: Date,
  acceptedBy: ObjectId,  // Reference to User
  createdAt: Date,
  updatedAt: Date
}
```

### Notification
```javascript
{
  _id: ObjectId,
  toUserId: ObjectId,    // Reference to User
  fromUserId: ObjectId,  // Reference to User
  type: String,          // "answer", "mention", "comment", "vote", "accept", "bounty"
  questionId: ObjectId,  // Reference to Question
  answerId: ObjectId,    // Reference to Answer (optional)
  content: String,
  isRead: Boolean,
  readAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Socket.IO Events

### Client to Server
- `join-question` - Join a question room for real-time updates
- `leave-question` - Leave a question room

### Server to Client
- `new-notification` - New notification received
- `question-updated` - Question has been updated
- `answer-added` - New answer added to question
- `vote-updated` - Vote count updated

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": [
    {
      "field": "title",
      "message": "Title must be at least 10 characters long"
    }
  ]
}
```

## Rate Limiting

- **Window**: 15 minutes
- **Max Requests**: 100 per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Security Features

- **CORS**: Configured for cross-origin requests
- **Helmet**: Security headers
- **Input Validation**: Joi schema validation
- **HTML Sanitization**: Basic XSS protection
- **Authentication**: Firebase ID token verification
- **Authorization**: Role-based access control

## Development

### Scripts

```bash
# Development with auto-restart
npm run dev

# Production
npm start

# Run tests
npm test

# Lint code
npm run lint
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/stackit |
| `FIREBASE_PROJECT_ID` | Firebase project ID | - |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure MongoDB connection string
- [ ] Set up Firebase Admin SDK credentials
- [ ] Configure CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (nginx)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 
