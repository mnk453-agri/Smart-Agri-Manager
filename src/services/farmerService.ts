import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  CreateFarmerInput,
  Farmer,
  FarmerSummary,
  UpdateFarmerInput,
} from '../types/farmer'

const farmersCollection = collection(db, 'farmers')

function createFarmerCode(documentId: string) {
  return `FARMER-${documentId.slice(0, 8).toUpperCase()}`
}

export async function createFarmer(
  input: CreateFarmerInput,
): Promise<string> {
  const farmerReference = doc(farmersCollection)
  const farmerCode = createFarmerCode(farmerReference.id)

  await setDoc(farmerReference, {
    organizationId: input.organizationId ?? '',
    farmerCode,

    farmerName: input.farmerName.trim(),
    casteName: input.casteName.trim(),
    phoneNumber: input.phoneNumber.trim(),
    notes: input.notes.trim(),

    status: 'active',
    assignedLandIds: [],

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return farmerReference.id
}

export async function getFarmers(
  organizationId?: string,
): Promise<Farmer[]> {
  const farmersQuery = query(
    farmersCollection,
    orderBy('createdAt', 'desc'),
  )

  const snapshot = await getDocs(farmersQuery)

  const farmers = snapshot.docs.map((farmerDocument) => {
    const data = farmerDocument.data()

    return {
      id: farmerDocument.id,

      organizationId: data.organizationId ?? '',
      farmerCode:
        data.farmerCode ??
        createFarmerCode(farmerDocument.id),

      farmerName: data.farmerName ?? '',
      casteName: data.casteName ?? '',
      phoneNumber: data.phoneNumber ?? '',
      notes: data.notes ?? '',

      status:
        data.status === 'inactive'
          ? 'archived'
          : (data.status ?? 'active'),

      assignedLandIds: Array.isArray(data.assignedLandIds)
        ? data.assignedLandIds
        : [],

      createdAt: data.createdAt ?? null,
      updatedAt: data.updatedAt ?? null,
    } satisfies Farmer
  })

  if (!organizationId) {
    return farmers
  }

  return farmers.filter(
    (farmer) =>
      farmer.organizationId === organizationId,
  )
}

export async function updateFarmer(
  farmerId: string,
  input: UpdateFarmerInput,
) {
  const farmerReference = doc(
    db,
    'farmers',
    farmerId,
  )

  await updateDoc(farmerReference, {
    organizationId: input.organizationId ?? '',

    farmerName: input.farmerName.trim(),
    casteName: input.casteName.trim(),
    phoneNumber: input.phoneNumber.trim(),
    notes: input.notes.trim(),

    ...(input.status !== undefined && {
      status: input.status,
    }),

    ...(input.assignedLandIds !== undefined && {
      assignedLandIds: input.assignedLandIds,
    }),

    updatedAt: serverTimestamp(),
  })
}

export async function archiveFarmer(
  farmerId: string,
) {
  const farmerReference = doc(
    db,
    'farmers',
    farmerId,
  )

  await updateDoc(farmerReference, {
    status: 'archived',
    updatedAt: serverTimestamp(),
  })
}

export async function restoreFarmer(
  farmerId: string,
) {
  const farmerReference = doc(
    db,
    'farmers',
    farmerId,
  )

  await updateDoc(farmerReference, {
    status: 'active',
    updatedAt: serverTimestamp(),
  })
}

/**
 * Use only for a mistaken farmer entry that has no linked
 * lands, crops, purchases, expenses, advances, or settlements.
 */
export async function deleteFarmer(
  farmerId: string,
) {
  const farmerReference = doc(
    db,
    'farmers',
    farmerId,
  )

  await deleteDoc(farmerReference)
}

export function calculateFarmerSummary(
  farmers: Farmer[],
): FarmerSummary {
  return farmers.reduce<FarmerSummary>(
    (summary, farmer) => {
      summary.totalFarmers += 1

      if (farmer.status === 'active') {
        summary.activeFarmers += 1
      }

      if (farmer.status === 'archived') {
        summary.archivedFarmers += 1
      }

      return summary
    },
    {
      totalFarmers: 0,
      activeFarmers: 0,
      archivedFarmers: 0,
    },
  )
}