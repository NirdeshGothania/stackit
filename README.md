# StackIt - Q&A Platform

A Stack Overflow-like Q&A application built with Flutter, Firebase, and Node.js backend.
Team Name: Team 4005 
Email: nirdeshgothania25@gmail.com

## Features

### 🏠 Home Screen
- View questions without login
- Search functionality
- Filter by: Newest, Unanswered, Most Voted
- Pagination support
- Question preview with answer count

### ❓ Ask Question Screen
- Rich text editor for question content
- Tag input system
- Form validation
- Preview before posting

### 📝 Question Detail Screen
- Full question display with rich text
- Answer list with voting
- Answer submission (requires login)
- Accept answer functionality (question author only)
- Login prompts for unauthenticated users

### 🔐 Authentication
- Email/password sign up and sign in
- Firebase Authentication integration
- User profile management
- Secure voting and posting

## Tech Stack

### Frontend
- **Flutter** - UI framework
- **Provider** - State management
- **Firebase Auth** - Authentication
- **Flutter Quill** - Rich text editor
- **Flutter HTML** - HTML rendering
- **HTTP** - API communication

### Backend (Node.js)
- RESTful API for questions and answers
- User authentication integration
- Voting system
- Search and filtering
- Pagination

## Setup Instructions

### 1. Prerequisites
- Flutter SDK (3.6.0 or higher)
- Node.js (for backend)
- Firebase project

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password provider
3. Get your Firebase configuration:
   - Go to Project Settings
   - Add your app (Android/iOS/Web)
   - Copy the configuration

4. Update `lib/firebase_options.dart` with your Firebase configuration:
   ```dart
   static const FirebaseOptions web = FirebaseOptions(
     apiKey: 'your-actual-api-key',
     appId: 'your-actual-app-id',
     messagingSenderId: 'your-actual-sender-id',
     projectId: 'your-actual-project-id',
     authDomain: 'your-actual-project-id.firebaseapp.com',
     storageBucket: 'your-actual-project-id.appspot.com',
   );
   ```

### 3. Flutter App Setup

1. Install dependencies:
   ```bash
   flutter pub get
   ```

2. Run the app:
   ```bash
   flutter run
   ```

### 4. Backend Setup (Optional for testing)

The app is designed to work with a Node.js backend. You can:

1. Create a simple Express.js server
2. Implement the API endpoints defined in `lib/services/api_service.dart`
3. Update the `baseUrl` in `ApiService` to point to your backend

For testing without a backend, you can modify the `ApiService` to return mock data.

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── firebase_options.dart     # Firebase configuration
├── models/
│   ├── question.dart         # Question data model
│   └── answer.dart          # Answer data model
├── services/
│   ├── api_service.dart      # HTTP API service
│   └── auth_service.dart     # Firebase auth service
├── providers/
│   └── auth_provider.dart    # Auth state management
└── screens/
    ├── home_screen.dart      # Questions list
    ├── ask_question_screen.dart  # Ask new question
    └── question_detail_screen.dart # Question details
```

## API Endpoints

The app expects these REST API endpoints:

### Questions
- `GET /api/questions` - List questions with pagination
- `GET /api/questions/:id` - Get single question
- `POST /api/questions` - Create new question
- `POST /api/questions/:id/vote` - Vote on question

### Answers
- `GET /api/questions/:id/answers` - Get answers for question
- `POST /api/questions/:id/answers` - Create new answer
- `POST /api/answers/:id/vote` - Vote on answer
- `POST /api/answers/:id/accept` - Accept answer

### Tags
- `GET /api/tags` - Get all tags

## Features to Add

- [ ] Google Sign-In integration
- [ ] Push notifications
- [ ] User profiles
- [ ] Question editing
- [ ] Answer editing
- [ ] Comment system
- [ ] Image uploads
- [ ] Markdown support
- [ ] Dark theme
- [ ] Offline support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
