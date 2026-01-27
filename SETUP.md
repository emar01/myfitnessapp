# MyFitnessApp Setup Guide

## 1. Firebase Setup
**Project ID**: `myfitnessapp-d8e0d`

1. Go to the [Firebase Console](https://console.firebase.google.com/) and select the project `myfitnessapp-d8e0d`.
2. **Authentication**:
   - Enable **Google** provider in Authentication > Sign-in method.
   - Configure **Authorized domains** if running on Web.
3. **Firestore Database**:
   - Create a database in **Production mode**.
   - Set up Rules (initially allow authorized read/write):
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /{document=**} {
           allow read, write: if request.auth != null;
         }
       }
     }
     ```
4. **Storage**:
   - Enable Storage.

## 2. API Keys
1. In Firebase Console > Project Settings > General:
   - Create a **Web App** to get the configuration for `.env`.
   - Popluate `.env` with the values:
     ```
     EXPO_PUBLIC_FIREBASE_API_KEY=...
     EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=myfitnessapp-d8e0d.firebaseapp.com
     ...
     ```

## 3. Google Sign-In (Native)
- **iOS**: Download `GoogleService-Info.plist` and place it in the root (add to app.json if managed).
- **Android**: Download `google-services.json` and place it in the root.
- Ensure SHA-1 fingerprints are added to Firebase Project Settings > Android App.

## 4. Running the App
- `npm install`
- `npx expo start`
