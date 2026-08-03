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
import type { CreateCropInput, Crop } from '../types/crop'

const cropsCollection = collection(db, 'crops')

export async function createCrop(input: CreateCropInput) {
  const documentReference = await addDoc(cropsCollection, {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return documentReference.id
}

export async function getCrops(): Promise<Crop[]> {
  const cropsQuery = query(
    cropsCollection,
    orderBy('createdAt', 'desc'),
  )

  const snapshot = await getDocs(cropsQuery)

  return snapshot.docs.map((cropDocument) => {
    const data = cropDocument.data()

    return {
      id: cropDocument.id,
      cropName: data.cropName ?? '',
      landId: data.landId ?? '',
      farmerId: data.farmerId ?? '',
      areaAcres: Number(data.areaAcres ?? 0),
      sowingDate: data.sowingDate ?? '',
      expectedHarvestDate: data.expectedHarvestDate ?? '',
      actualHarvestDate: data.actualHarvestDate ?? '',
      season: data.season ?? 'other',
      shareType: data.shareType ?? 'shared_with_farmer',
      status: data.status ?? 'planned',
      notes: data.notes ?? '',
      createdAt: data.createdAt ?? null,
      updatedAt: data.updatedAt ?? null,
    }
  })
}

export async function updateCrop(
  cropId: string,
  input: CreateCropInput,
) {
  const cropReference = doc(db, 'crops', cropId)

  await updateDoc(cropReference, {
    ...input,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteCrop(cropId: string) {
  const cropReference = doc(db, 'crops', cropId)

  await deleteDoc(cropReference)
}