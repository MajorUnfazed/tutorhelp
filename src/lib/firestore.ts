import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { ConnectionRequest, ConnectionRequestStatus, IntentCard } from '@/types';

function toIntentCard(id: string, data: any): IntentCard {
  return {
    id,
    ownerUid: data.ownerUid,
    ownerName: data.ownerName,
    ownerEmail: data.ownerEmail,
    ownerPhotoURL: data.ownerPhotoURL,
    eventType: data.eventType,
    eventName: data.eventName,
    lookingForRoles: Array.isArray(data.lookingForRoles) ? data.lookingForRoles : [],
    requiredSkills: Array.isArray(data.requiredSkills) ? data.requiredSkills : [],
    availability: data.availability,
    hostelStatus: data.hostelStatus,
    commitmentLevel: data.commitmentLevel,
    shortGoal: data.shortGoal,
    isPublic: data.isPublic === true,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
}

function toRequest(id: string, data: any): ConnectionRequest {
  return {
    id,
    fromUid: data.fromUid,
    fromName: data.fromName,
    fromPhotoURL: data.fromPhotoURL,
    toUid: data.toUid,
    toName: data.toName,
    toPhotoURL: data.toPhotoURL,
    fromIntentCardId: data.fromIntentCardId,
    toIntentCardId: data.toIntentCardId,
    status: data.status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  };
}

export async function listMyIntentCards(ownerUid: string): Promise<IntentCard[]> {
  const q = query(collection(db, 'intentCards'), where('ownerUid', '==', ownerUid), limit(50));
  const snap = await getDocs(q);
  const cards = snap.docs.map((d) => toIntentCard(d.id, d.data()));
  // Sort client-side to avoid composite indexes.
  cards.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
  return cards;
}

export async function getIntentCardById(id: string): Promise<IntentCard | null> {
  const ref = doc(db, 'intentCards', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toIntentCard(snap.id, snap.data());
}

export async function createIntentCard(input: Omit<IntentCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'intentCards'), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return ref.id;
}

export async function updateIntentCard(
  id: string,
  input: Partial<Omit<IntentCard, 'id' | 'ownerUid' | 'ownerName' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const ref = doc(db, 'intentCards', id);
  await updateDoc(ref, {
    ...input,
    updatedAt: serverTimestamp()
  });
}

export async function deleteIntentCard(id: string): Promise<void> {
  await deleteDoc(doc(db, 'intentCards', id));
}

export async function listPublicIntentCards(limitN: number): Promise<IntentCard[]> {
  const q = query(collection(db, 'intentCards'), where('isPublic', '==', true), limit(limitN));
  const snap = await getDocs(q);
  const cards = snap.docs.map((d) => toIntentCard(d.id, d.data()));
  return cards;
}

export async function createConnectionRequest(input: Omit<ConnectionRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
  await addDoc(collection(db, 'connectionRequests'), {
    ...input,
    status: 'pending' satisfies ConnectionRequestStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

export async function listIncomingRequests(uid: string): Promise<ConnectionRequest[]> {
  const q = query(collection(db, 'connectionRequests'), where('toUid', '==', uid), limit(50));
  const snap = await getDocs(q);
  const reqs = snap.docs.map((d) => toRequest(d.id, d.data()));
  reqs.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
  return reqs;
}

export async function listOutgoingRequests(uid: string): Promise<ConnectionRequest[]> {
  const q = query(collection(db, 'connectionRequests'), where('fromUid', '==', uid), limit(50));
  const snap = await getDocs(q);
  const reqs = snap.docs.map((d) => toRequest(d.id, d.data()));
  reqs.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
  return reqs;
}

export async function updateRequestStatus(id: string, status: ConnectionRequestStatus): Promise<void> {
  await updateDoc(doc(db, 'connectionRequests', id), {
    status,
    updatedAt: serverTimestamp()
  });
}

export async function createConnectionFromRequest(requestId: string, fromUid: string, toUid: string): Promise<void> {
  const uids = [fromUid, toUid].sort() as [string, string];
  await addDoc(collection(db, 'connections'), {
    uids,
    requestId,
    createdAt: serverTimestamp()
  });
}
