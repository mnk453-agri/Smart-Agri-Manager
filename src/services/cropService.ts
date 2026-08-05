import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  CreateCropInput,
  Crop,
  CropSeason,
  CropShareType,
  CropStatus,
  CropSummary,
  UpdateCropInput,
} from '../types/crop'
import type { LandOwnershipType } from '../types/land'

const cropsCollection = collection(db, 'crops')

async function createCropCode() {
  const cropsSnapshot =
    await getDocs(cropsCollection)

  const highestExistingCode =
    cropsSnapshot.docs.reduce(
      (highest, cropDocument) => {
        const cropCode = String(
          cropDocument.data().cropCode ?? '',
        )
        const match =
          /^CROP-(\d+)$/.exec(cropCode)

        return match
          ? Math.max(
              highest,
              Number(match[1]),
            )
          : highest
      },
      0,
    )

  const counterReference = doc(
    db,
    'counters',
    'crops',
  )

  return runTransaction(
    db,
    async (transaction) => {
      const counterSnapshot =
        await transaction.get(
          counterReference,
        )

      const storedValue = Number(
        counterSnapshot.data()?.value ?? 0,
      )

      const nextValue =
        Math.max(
          storedValue,
          highestExistingCode,
          cropsSnapshot.size,
        ) + 1

      transaction.set(
        counterReference,
        {
          value: nextValue,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      return `CROP-${String(nextValue).padStart(3, '0')}`
    },
  )
}

export async function createCrop(
  input: CreateCropInput,
): Promise<string> {
  const cropReference = doc(cropsCollection)
  const cropCode = await createCropCode()

  await setDoc(cropReference, {
    organizationId: input.organizationId,
    cropCode,

    cropName: input.cropName.trim(),
    season: input.season,
    status: input.status,

    landAssignmentId: input.landAssignmentId,
    landId: input.landId,
    farmerId: input.farmerId,
    areaAcres: Number(input.areaAcres),

    landOwnershipType:
      input.landOwnershipType,
    cropShareType: input.cropShareType,
    ownerSharePercentage: Number(
      input.ownerSharePercentage,
    ),
    farmerSharePercentage: Number(
      input.farmerSharePercentage,
    ),

    sowingDate: input.sowingDate,
    expectedHarvestDate:
      input.expectedHarvestDate,
    actualHarvestDate:
      input.actualHarvestDate,
    notes: input.notes.trim(),

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return cropReference.id
}

export async function getCrops(
  organizationId?: string,
): Promise<Crop[]> {
  const cropsQuery = query(
    cropsCollection,
    orderBy('createdAt', 'desc'),
  )

  const snapshot = await getDocs(cropsQuery)

  const crops = snapshot.docs.map(
    (cropDocument) => {
      const data = cropDocument.data()

      return {
        id: cropDocument.id,
        organizationId:
          data.organizationId ?? '',
        cropCode:
          data.cropCode ?? 'CROP-000',

        cropName: data.cropName ?? '',
        season:
          (data.season as CropSeason) ??
          'other',
        status:
          (data.status as CropStatus) ??
          'planned',

        landAssignmentId:
          data.landAssignmentId ?? '',
        landId: data.landId ?? '',
        farmerId: data.farmerId ?? '',
        areaAcres: Number(
          data.areaAcres ?? 0,
        ),

        landOwnershipType:
          (data.landOwnershipType as LandOwnershipType) ??
          'owned',
        cropShareType:
          (data.cropShareType as CropShareType) ??
          'owner_only',
        ownerSharePercentage: Number(
          data.ownerSharePercentage ?? 100,
        ),
        farmerSharePercentage: Number(
          data.farmerSharePercentage ?? 0,
        ),

        sowingDate: data.sowingDate ?? '',
        expectedHarvestDate:
          data.expectedHarvestDate ?? '',
        actualHarvestDate:
          data.actualHarvestDate ?? '',
        notes: data.notes ?? '',

        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      } satisfies Crop
    },
  )

  if (!organizationId) {
    return crops
  }

  return crops.filter(
    (crop) =>
      crop.organizationId === organizationId,
  )
}

export async function updateCrop(
  cropId: string,
  input: UpdateCropInput,
) {
  const cropReference = doc(
    db,
    'crops',
    cropId,
  )

  await updateDoc(cropReference, {
    organizationId: input.organizationId,

    cropName: input.cropName.trim(),
    season: input.season,
    status: input.status,

    landAssignmentId: input.landAssignmentId,
    landId: input.landId,
    farmerId: input.farmerId,
    areaAcres: Number(input.areaAcres),

    landOwnershipType:
      input.landOwnershipType,
    cropShareType: input.cropShareType,
    ownerSharePercentage: Number(
      input.ownerSharePercentage,
    ),
    farmerSharePercentage: Number(
      input.farmerSharePercentage,
    ),

    sowingDate: input.sowingDate,
    expectedHarvestDate:
      input.expectedHarvestDate,
    actualHarvestDate:
      input.actualHarvestDate,
    notes: input.notes.trim(),

    updatedAt: serverTimestamp(),
  })
}

/**
 * Use only when no expense, sale, advance,
 * harvest, or settlement is linked to the crop.
 */
export async function deleteCrop(
  cropId: string,
) {
  const cropReference = doc(
    db,
    'crops',
    cropId,
  )

  await deleteDoc(cropReference)
}

export function calculateCropSummary(
  crops: Crop[],
): CropSummary {
  return crops.reduce<CropSummary>(
    (summary, crop) => {
      summary.totalCrops += 1
      summary.totalCropAcres +=
        crop.areaAcres

      if (crop.status === 'planned') {
        summary.plannedCrops += 1
      }

      if (crop.status === 'active') {
        summary.activeCrops += 1
      }

      if (crop.status === 'harvested') {
        summary.harvestedCrops += 1
      }

      if (crop.status === 'closed') {
        summary.closedCrops += 1
      }

      return summary
    },
    {
      totalCrops: 0,
      plannedCrops: 0,
      activeCrops: 0,
      harvestedCrops: 0,
      closedCrops: 0,
      totalCropAcres: 0,
    },
  )
}