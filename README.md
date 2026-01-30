# MyFitnessApp

A comprehensive fitness tracking application built with React Native (Expo) and Google Firebase. Features AI-powered coaching, seamless Strava synchronization, and detailed workout logging.

## 🚀 Live App
**Web Version:** [https://myfitnessapp-d8e0d.web.app](https://myfitnessapp-d8e0d.web.app)

## ✨ Key Features
*   **AI Coach ("Atlas")**: Personalized workout advice and analysis using Google Gemini.
*   **Strava Sync**: Connect your Strava account to automatically fetch and link running activities to your planned workouts.
*   **Workout Logging**: Specialized modes for Strength (Sets/Reps) and Running (Distance/Pace).
*   **Smart Planning**: Drag-and-drop workout scheduling (Desktop view).
*   **Progress Tracking**: Visualize your lifting and running progress over time.

## 🛠 Tech Stack
*   **Frontend**: React Native, Expo (Router, Auth Session)
*   **Backend**: Firebase (Auth, Firestore, Hosting)
*   **AI**: Google Gemini API
*   **Integrations**: Strava API

## 🏃‍♂️ Getting Started

### Prerequisites
*   Node.js (> 20)
*   Expo CLI

### Installation
1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    *   Copy `.env.example` to `.env`.
    *   Fill in your Firebase, Google AI, and Strava API keys.

### Running Locally
```bash
npx expo start
```
Press `w` to open the Web version, or scan the QR code with Expo Go.

### Deployment
The app uses GitHub Actions for CI/CD. Pushing to the `main` branch automatically builds and deploys the web version to Firebase Hosting.
