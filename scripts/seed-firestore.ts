import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { PARTICIPANTS } from '../src/data';
import { EVENTS } from '../src/data';
import { SESSIONS } from '../src/data';
import * as fs from 'fs';
import * as path from 'path';

// Load service account key
const serviceAccountPath = path.resolve(process.cwd(), 'service-account-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ service-account-key.json not found in project root');
  console.log('📥 Download it from Firebase Console > Project Settings > Service Accounts > Generate new private key');
  console.log('📁 Save as service-account-key.json in project root');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

const app = getApps().length === 0 ? initializeApp({ credential: cert(serviceAccount) }) : getApps()[0];
const db = getFirestore(app);

async function seed() {
  console.log('🌱 Seeding Firestore...');

  // 1. Create events
  console.log('📅 Creating events...');
  for (const event of EVENTS) {
    const eventRef = db.collection('events').doc(event.id);
    await eventRef.set({
      ...event,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`  ✅ ${event.name}`);
  }

  // 2. Create performers
  console.log('🎭 Creating performers...');
  for (const performer of PARTICIPANTS) {
    const performerRef = db.collection('performers').doc(performer.id);
    await performerRef.set({
      ...performer,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`  ✅ ${performer.name}`);
  }

  // 3. Create sessions
  console.log('📅 Creating sessions...');
  for (const session of SESSIONS) {
    const sessionRef = db.collection('sessions').doc(session.id);
    await sessionRef.set({
      ...session,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`  ✅ ${session.title}`);
  }

  console.log('\n✅ Seeding complete!');
  process.exit(0);
}

seed().catch(console.error);