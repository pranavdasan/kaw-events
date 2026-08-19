# KAW Events - Firebase Migration Guide

## Prerequisites

1. **Firebase Project**: Create a project at https://console.firebase.google.com
2. **Enable Services**: 
   - Authentication > Sign-in method > Email/Password ✅
   - Firestore Database > Create database (Native mode)
   - Authentication > Settings > Authorized domains (add localhost, your domain)

## Setup

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2. Initialize Firebase in Project
```bash
firebase use --add  # Select your project
# or
firebase projects:create <project-id>
firebase use <project-id>
```

### 3. Generate Service Account Key
1. Firebase Console > Project Settings > Service Accounts
2. Click "Generate new private key"
3. Save as `service-account-key.json` in project root
4. **Add to .gitignore** (already in .gitignore)

### 4. Deploy Firestore Rules & Indexes
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 5. Seed Firestore with Initial Data
```bash
# Copy service-account-key.json to project root first
npx tsx scripts/seed-firestore.ts
```

### 6. Test with Emulators (Optional)
```bash
VITE_USE_EMULATORS=true npm run dev
# In another terminal:
firebase emulators:start
```

### 7. Deploy to Production
```bash
npm run build
firebase deploy
```

## Local Development

```bash
# Start dev server
npm run dev

# Run tests
npm run test

# Type check
npm run lint
```

## Environment Variables

Create `.env.local`:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_ADMIN_UIDS=uid1,uid2,uid3  # Comma-separated admin UIDs
VITE_USE_EMULATORS=false  # Set to true for emulators
```

## Firebase Console Setup Checklist

- [ ] Authentication > Sign-in method > Email/Password: **Enabled**
- [ ] Firestore Database > Create database > Start in production mode (or test mode for dev)
- [ ] Firestore > Rules: Deploy from `firestore.rules`
- [ ] Firestore > Indexes: Deploy from `firestore.indexes.json`
- [ ] Authentication > Settings > Authorized domains: Add `localhost`, your domain
- [ ] Hosting: Connect custom domain if needed

## Data Model

```
events/{eventId}
  - name, description, date, startTime, endTime, imageUrl, createdAt, updatedAt

sessions/{sessionId}
  - eventId, title, description, durationInMin, track, room, participants[], isLive, type, order, isPending

performers/{performerId}
  - name, role, group, avatarUrl, eventIds[]

bookmarks/{bookmarkId}
  userId, sessionId, eventId, createdAt

admins/{uid}
  email, role, createdAt
```

## Scripts

```bash
# Seed Firestore with initial data
npx tsx scripts/seed-firestore.ts

# Type check
npm run lint

# Run tests
npm run test

# Build for production
npm run build

# Deploy to Firebase
firebase deploy
```

## Security Rules Summary

- **Events/Sessions/Performers**: Public read, Admin write
- **Bookmarks**: User owns their bookmarks
- **Admins**: Admin-only access

Admin status determined by:
1. Custom claim `admin: true` (preferred, set via Admin SDK)
2. Fallback: UID in `VITE_ADMIN_UIDS` env var