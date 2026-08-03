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
  CreateLandInput,
  Land,
  LandSummary,
  UpdateLandInput,
} from '../types/land'

const landsCollection = collection(db, 'lands')

function createLandCode(documentId: string) {
  return `LAND-${documentId.slice(0, 8).toUpperCase()}`
}

export async function createLand(
  input: CreateLandInput,
): Promise<string> {
  const landReference = doc(landsCollection)
  const landCode = createLandCode(landReference.id)

  await setDoc(landReference, {
    organizationId: input.organizationId ?? '',
    landCode,

    landName: input.landName.trim(),
    location: input.location.trim(),
    totalAcres: Number(input.totalAcres),
    ownership: input.ownership,
    soilType: input.soilType.trim(),

    annualLeaseAmount:
      input.ownership === 'owned'
        ? 0
        : Number(input.annualLeaseAmount),

    notes: input.notes.trim(),

    status: 'active',
    assignedFarmerId: '',

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return landReference.id
}

export async function getLands(
  organizationId?: string,
): Promise<Land[]> {
  const landsQuery = query(
    landsCollection,
    orderBy('createdAt', 'desc'),
  )

  const snapshot = await getDocs(landsQuery)

  const lands = snapshot.docs.map((landDocument) => {
    const data = landDocument.data()

    return {
      id: landDocument.id,

      organizationId: data.organizationId ?? '',
      landCode:
        data.landCode ??
        createLandCode(landDocument.id),

      landName: data.landName ?? '',
      location: data.location ?? '',
      totalAcres: Number(data.totalAcres ?? 0),
      ownership: data.ownership ?? 'owned',
      soilType: data.soilType ?? '',
      annualLeaseAmount: Number(
        data.annualLeaseAmount ?? 0,
      ),
      notes: data.notes ?? '',

      status: data.status ?? 'active',
      assignedFarmerId:
        data.assignedFarmerId ?? '',

      createdAt: data.createdAt ?? null,
      updatedAt: data.updatedAt ?? null,
    } satisfies Land
  })

  if (!organizationId) {
    return lands
  }

  return lands.filter(
    (land) =>
      land.organizationId === organizationId,
  )
}

export async function updateLand(
  landId: string,
  input: UpdateLandInput,
) {
  const landReference = doc(db, 'lands', landId)

  await updateDoc(landReference, {
    organizationId: input.organizationId ?? '',
    landName: input.landName.trim(),
    location: input.location.trim(),
    totalAcres: Number(input.totalAcres),
    ownership: input.ownership,
    soilType: input.soilType.trim(),

    annualLeaseAmount:
      input.ownership === 'owned'
        ? 0
        : Number(input.annualLeaseAmount),

    notes: input.notes.trim(),

    ...(input.status !== undefined && {
      status: input.status,
    }),

    ...(input.assignedFarmerId !== undefined && {
      assignedFarmerId: input.assignedFarmerId,
    }),

    updatedAt: serverTimestamp(),
  })
}

export async function archiveLand(
  landId: string,
) {
  const landReference = doc(db, 'lands', landId)

  await updateDoc(landReference, {
    status: 'archived',
    updatedAt: serverTimestamp(),
  })
}

export async function restoreLand(
  landId: string,
) {
  const landReference = doc(db, 'lands', landId)

  await updateDoc(landReference, {
    status: 'active',
    updatedAt: serverTimestamp(),
  })
}

/**
 * Use only for a mistaken land entry that has no linked
 * crops, assignments, purchases, expenses, or sales.
 */
export async function deleteLand(
  landId: string,
) {
  const landReference = doc(db, 'lands', landId)
  await deleteDoc(landReference)
}

export function calculateLandSummary(
  lands: Land[],
): LandSummary {
  const activeLands = lands.filter(
    (land) => land.status === 'active',
  )

  return activeLands.reduce<LandSummary>(
    (summary, land) => {
      summary.totalLandSites += 1
      summary.totalLandAcres += land.totalAcres

      if (land.ownership === 'owned') {
        summary.ownedLandAcres +=
          land.totalAcres
      }

      if (land.ownership === 'leased') {
        summary.leasedLandAcres +=
          land.totalAcres
      }

      return summary
    },
    {
      totalLandSites: 0,
      totalLandAcres: 0,
      ownedLandAcres: 0,
      leasedLandAcres: 0,
    },
  )
}