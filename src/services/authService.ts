import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import type {
  CompleteProfileInput,
  CreateWorkspaceInput,
  LoginInput,
  Organization,
  OrganizationMembership,
  RegisterAccountInput,
  UserAccount,
} from '../types/auth'

export async function registerAccount(
  input: RegisterAccountInput,
) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    input.email.trim(),
    input.password,
  )

  const firebaseUser = userCredential.user
  const userReference = doc(db, 'users', firebaseUser.uid)
  const batch = writeBatch(db)

  batch.set(userReference, {
    uid: firebaseUser.uid,
    fullName: input.fullName.trim(),
    phoneNumber: input.phoneNumber.trim(),
    email: input.email.trim().toLowerCase(),
    country: '',
    agricultureBusinessName: '',
    preferredLanguage: input.preferredLanguage,
    profileCompleted: false,
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await batch.commit()

  return firebaseUser
}

export async function completeUserProfile(
  uid: string,
  input: CompleteProfileInput,
) {
  const userReference = doc(db, 'users', uid)

  await updateDoc(userReference, {
    fullName: input.fullName.trim(),
    phoneNumber: input.phoneNumber.trim(),
    country: input.country.trim(),
    agricultureBusinessName:
      input.agricultureBusinessName.trim(),
    preferredLanguage: input.preferredLanguage,
    profileCompleted: true,
    updatedAt: serverTimestamp(),
  })
}

export async function createWorkspaceForOwner(
  uid: string,
  input: CreateWorkspaceInput,
) {
  const organizationReference = doc(
    collection(db, 'organizations'),
  )

  const membershipReference = doc(
    collection(db, 'organizationMemberships'),
  )

  const batch = writeBatch(db)

  batch.set(organizationReference, {
    name: input.organizationName.trim(),
    currency: 'PKR',
    landUnit: 'Acres',
    defaultLanguage: input.defaultLanguage,
    setupCompleted: false,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  batch.set(membershipReference, {
    organizationId: organizationReference.id,
    userId: uid,
    role: 'owner',
    linkedFarmerId: null,
    isActive: true,
    invitedBy: null,
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  await batch.commit()

  return {
    organizationId: organizationReference.id,
    membershipId: membershipReference.id,
  }
}

export async function loginUser(input: LoginInput) {
  return signInWithEmailAndPassword(
    auth,
    input.email.trim(),
    input.password,
  )
}

export async function logoutUser() {
  await signOut(auth)
}

export async function resetUserPassword(email: string) {
  await sendPasswordResetEmail(auth, email.trim())
}

export async function getUserAccount(
  uid: string,
): Promise<UserAccount | null> {
  const snapshot = await getDoc(doc(db, 'users', uid))

  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()

  return {
    uid: snapshot.id,
    fullName: data.fullName ?? '',
    phoneNumber: data.phoneNumber ?? '',
    email: data.email ?? '',
    country: data.country ?? '',
    agricultureBusinessName:
      data.agricultureBusinessName ?? '',
    preferredLanguage: data.preferredLanguage ?? 'en',
    profileCompleted: Boolean(data.profileCompleted),
    isActive: Boolean(data.isActive),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

export async function getOrganization(
  organizationId: string,
): Promise<Organization | null> {
  const snapshot = await getDoc(
    doc(db, 'organizations', organizationId),
  )

  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()

  return {
    id: snapshot.id,
    name: data.name ?? '',
    currency: 'PKR',
    landUnit: 'Acres',
    defaultLanguage: data.defaultLanguage ?? 'en',
    setupCompleted: Boolean(data.setupCompleted),
    createdBy: data.createdBy ?? '',
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  }
}

export async function getUserMemberships(
  uid: string,
): Promise<OrganizationMembership[]> {
  const membershipsQuery = query(
    collection(db, 'organizationMemberships'),
    where('userId', '==', uid),
    where('isActive', '==', true),
  )

  const snapshot = await getDocs(membershipsQuery)

  return snapshot.docs.map((membershipDocument) => {
    const data = membershipDocument.data()

    return {
      id: membershipDocument.id,
      organizationId: data.organizationId ?? '',
      userId: data.userId ?? '',
      role: data.role ?? 'farmer',
      linkedFarmerId: data.linkedFarmerId ?? null,
      isActive: Boolean(data.isActive),
      invitedBy: data.invitedBy ?? null,
      joinedAt: data.joinedAt ?? null,
      updatedAt: data.updatedAt ?? null,
    }
  })
}