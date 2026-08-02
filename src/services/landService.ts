import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { CreateLandInput, Land } from '../types/land'

const landsCollection = collection(db, 'lands')

export async function createLand(input: CreateLandInput) {
  const documentReference = await addDoc(landsCollection, {
    ...input,
    annualLeaseAmount:
      input.ownership === 'owned' ? 0 : input.annualLeaseAmount,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return documentReference.id
}

export async function getLands(): Promise<Land[]> {
  const landsQuery = query(landsCollection, orderBy('createdAt', 'desc'))
  const snapshot = await getDocs(landsQuery)

  return snapshot.docs.map((landDocument) => {
    const data = landDocument.data()

    return {
      id: landDocument.id,
      landName: data.landName ?? '',
      location: data.location ?? '',
      totalAcres: Number(data.totalAcres ?? 0),
      ownership: data.ownership ?? 'owned',
      soilType: data.soilType ?? '',
      annualLeaseAmount: Number(data.annualLeaseAmount ?? 0),
      notes: data.notes ?? '',
      createdAt: data.createdAt ?? null,
      updatedAt: data.updatedAt ?? null,
    }
  })
}

export async function updateLand(
  landId: string,
  input: CreateLandInput,
) {
  const landReference = doc(db, 'lands', landId)

  await updateDoc(landReference, {
    ...input,
    annualLeaseAmount:
      input.ownership === 'owned' ? 0 : input.annualLeaseAmount,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteLand(landId: string) {
  const landReference = doc(db, 'lands', landId)
  await deleteDoc(landReference)
}