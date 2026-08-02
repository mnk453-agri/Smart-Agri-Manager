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
import type { CreateFarmerInput, Farmer } from '../types/farmer'

const farmersCollection = collection(db, 'farmers')

export async function createFarmer(input: CreateFarmerInput) {
  const documentReference = await addDoc(farmersCollection, {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return documentReference.id
}

export async function getFarmers(): Promise<Farmer[]> {
  const farmersQuery = query(
    farmersCollection,
    orderBy('createdAt', 'desc'),
  )

  const snapshot = await getDocs(farmersQuery)

  return snapshot.docs.map((farmerDocument) => {
    const data = farmerDocument.data()

    return {
      id: farmerDocument.id,
      farmerName: data.farmerName ?? '',
      casteName: data.casteName ?? '',
      phoneNumber: data.phoneNumber ?? '',
      status: data.status ?? 'active',
      notes: data.notes ?? '',
      createdAt: data.createdAt ?? null,
      updatedAt: data.updatedAt ?? null,
    }
  })
}

export async function updateFarmer(
  farmerId: string,
  input: CreateFarmerInput,
) {
  const farmerReference = doc(db, 'farmers', farmerId)

  await updateDoc(farmerReference, {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteFarmer(farmerId: string) {
  const farmerReference = doc(db, 'farmers', farmerId)

  await deleteDoc(farmerReference)
}