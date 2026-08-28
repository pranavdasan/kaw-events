# KAW Events - Schedule & Agenda App

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`

2. Copy `.env.example` to `.env.local` and add your Firebase config:
    ```
    VITE_FIREBASE_API_KEY=your_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

3. Run the app:
   `npm run dev`

## Build
`npm run build`

## Deploy
`firebase deploy`