import type { Timestamp } from 'firebase/firestore';

export type EventType = 'Hackathon' | 'Sports' | 'Project' | 'Other';

export type CommitmentLevel = 'casual' | 'serious' | 'win';

export type HostelStatus = 'hosteler' | 'day-scholar';

export type Availability = {
  weekdays: boolean;
  weekends: boolean;
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
};

export type Profile = {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  hostelStatus?: HostelStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type IntentCard = {
  id: string;
  ownerUid: string;
  ownerName: string;
  ownerEmail?: string;
  ownerPhotoURL?: string;

  eventType: EventType;
  eventName: string;

  lookingForRoles: string[];
  requiredSkills: string[];

  availability: Availability;
  hostelStatus: HostelStatus;
  commitmentLevel: CommitmentLevel;
  shortGoal: string;

  isPublic: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type ConnectionRequestStatus = 'pending' | 'accepted' | 'rejected';

export type ConnectionRequest = {
  id: string;
  fromUid: string;
  fromName: string;
  fromPhotoURL?: string;

  toUid: string;
  toName: string;
  toPhotoURL?: string;

  fromIntentCardId: string;
  toIntentCardId: string;

  status: ConnectionRequestStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

export type Connection = {
  id: string;
  uids: [string, string];
  requestId: string;
  createdAt?: Timestamp;
};
