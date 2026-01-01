import fs from 'node:fs';
import path from 'node:path';

import admin from 'firebase-admin';

function readServiceAccount() {
  const p = process.env.SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!p) {
    throw new Error(
      'Missing service account. Set SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS to your downloaded service account JSON file.'
    );
  }
  const abs = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
  const json = JSON.parse(fs.readFileSync(abs, 'utf8'));
  return json;
}

const serviceAccount = readServiceAccount();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Password123!';

const demoUsers = [
  { name: 'Aarthi', email: 'demo01@sastra-teammatch.test', hostelStatus: 'hosteler' },
  { name: 'Bala', email: 'demo02@sastra-teammatch.test', hostelStatus: 'day-scholar' },
  { name: 'Charan', email: 'demo03@sastra-teammatch.test', hostelStatus: 'hosteler' },
  { name: 'Divya', email: 'demo04@sastra-teammatch.test', hostelStatus: 'day-scholar' },
  { name: 'Ezhil', email: 'demo05@sastra-teammatch.test', hostelStatus: 'hosteler' },
  { name: 'Farah', email: 'demo06@sastra-teammatch.test', hostelStatus: 'day-scholar' },
  { name: 'Gokul', email: 'demo07@sastra-teammatch.test', hostelStatus: 'hosteler' },
  { name: 'Hari', email: 'demo08@sastra-teammatch.test', hostelStatus: 'day-scholar' },
  { name: 'Isha', email: 'demo09@sastra-teammatch.test', hostelStatus: 'hosteler' },
  { name: 'Jeeva', email: 'demo10@sastra-teammatch.test', hostelStatus: 'day-scholar' }
];

const sampleCards = [
  {
    eventType: 'Hackathon',
    eventName: 'Smart India Hackathon',
    lookingForRoles: ['frontend', 'backend', 'presenter'],
    requiredSkills: ['React', 'Firebase', 'TypeScript'],
    availability: { weekdays: true, weekends: true, startTime: '18:00', endTime: '22:00' },
    commitmentLevel: 'win',
    shortGoal: 'Ship a clean MVP and pitch confidently.'
  },
  {
    eventType: 'Project',
    eventName: 'Campus App Project',
    lookingForRoles: ['designer', 'frontend'],
    requiredSkills: ['Figma', 'UI/UX', 'React'],
    availability: { weekdays: true, weekends: false, startTime: '17:00', endTime: '20:00' },
    commitmentLevel: 'serious',
    shortGoal: 'Build a usable product with great UX.'
  },
  {
    eventType: 'Sports',
    eventName: 'Inter-hostel Badminton',
    lookingForRoles: ['manager', 'presenter'],
    requiredSkills: ['Leadership', 'Coordination'],
    availability: { weekdays: false, weekends: true, startTime: '08:00', endTime: '11:00' },
    commitmentLevel: 'casual',
    shortGoal: 'Have fun, play well, and make friends.'
  }
];

function pick(arr, i) {
  return arr[i % arr.length];
}

async function upsertUser({ name, email }) {
  try {
    const existing = await auth.getUserByEmail(email);
    await auth.updateUser(existing.uid, { displayName: name, password: DEMO_PASSWORD });
    return existing.uid;
  } catch (e) {
    const created = await auth.createUser({ email, password: DEMO_PASSWORD, displayName: name });
    return created.uid;
  }
}

async function run() {
  console.log('Seeding 10 demo users + intent cards…');
  console.log(`Demo password: ${DEMO_PASSWORD}`);

  for (let i = 0; i < demoUsers.length; i++) {
    const u = demoUsers[i];
    const uid = await upsertUser(u);

    await db.collection('profiles').doc(uid).set(
      {
        uid,
        name: u.name,
        email: u.email,
        hostelStatus: u.hostelStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    const base = pick(sampleCards, i);
    await db.collection('intentCards').add({
      ownerUid: uid,
      ownerName: u.name,
      ownerEmail: u.email,
      ownerPhotoURL: null,
      eventType: base.eventType,
      eventName: base.eventName,
      lookingForRoles: base.lookingForRoles,
      requiredSkills: base.requiredSkills,
      availability: base.availability,
      hostelStatus: u.hostelStatus,
      commitmentLevel: base.commitmentLevel,
      shortGoal: base.shortGoal,
      isPublic: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Add a second card for some users to make matching more interesting.
    if (i % 3 === 0) {
      const extra = pick(sampleCards, i + 1);
      await db.collection('intentCards').add({
        ownerUid: uid,
        ownerName: u.name,
        ownerEmail: u.email,
        ownerPhotoURL: null,
        eventType: extra.eventType,
        eventName: extra.eventName,
        lookingForRoles: extra.lookingForRoles,
        requiredSkills: extra.requiredSkills,
        availability: extra.availability,
        hostelStatus: u.hostelStatus,
        commitmentLevel: extra.commitmentLevel,
        shortGoal: extra.shortGoal,
        isPublic: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    console.log(`- ${u.name} (${u.email}) uid=${uid}`);
  }

  console.log('Done.');
  console.log('Next: enable Email/Password auth, then sign in with demo emails in the app.');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
