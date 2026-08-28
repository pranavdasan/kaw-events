import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

const serviceAccountPath = path.resolve(process.cwd(), 'service-account-key.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('service-account-key.json not found. Copy service-account-key.json.example and fill in your credentials.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

const app = getApps().length === 0 ? initializeApp({
  credential: cert(serviceAccount),
}) : getApps()[0];

const auth = getAuth(app);

async function setAdminClaims(uid: string) {
  try {
    await auth.setCustomUserClaims(uid, { admin: true });
    console.log(`✅ Set admin claim for user: ${uid}`);
  } catch (error) {
    console.error(`❌ Failed to set admin claim for ${uid}:`, error);
  }
}

async function removeAdminClaims(uid: string) {
  try {
    await auth.setCustomUserClaims(uid, { admin: false });
    console.log(`✅ Removed admin claim for user: ${uid}`);
  } catch (error) {
    console.error(`❌ Failed to remove admin claim for ${uid}:`, error);
  }
}

async function listAdmins() {
  try {
    const listUsersResult = await auth.listUsers(1000);
    const admins = listUsersResult.users.filter(user => user.customClaims?.admin === true);
    if (admins.length === 0) {
      console.log('No admin users found.');
    } else {
      console.log('Current admin users:');
      admins.forEach(user => console.log(`  - ${user.uid} (${user.email})`));
    }
  } catch (error) {
    console.error('❌ Failed to list users:', error);
  }
}

const args = process.argv.slice(2);
const command = args[0];
const uid = args[1];

if (command === 'set' && uid) {
  await setAdminClaims(uid);
} else if (command === 'remove' && uid) {
  await removeAdminClaims(uid);
} else if (command === 'list') {
  await listAdmins();
} else {
  console.log('Usage:');
  console.log('  npx tsx scripts/set-admin-claims.ts set <uid>     - Grant admin access');
  console.log('  npx tsx scripts/set-admin-claims.ts remove <uid>  - Revoke admin access');
  console.log('  npx tsx scripts/set-admin-claims.ts list          - List current admins');
}

process.exit(0);