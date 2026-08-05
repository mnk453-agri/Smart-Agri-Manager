import type { Timestamp } from 'firebase/firestore'
import type { LandOwnershipType } from './land'

export type CropStatus =
  | 'planned'
  | 'active'
  | 'harvested'
  | 'closed'

export type CropShareType =
  | 'shared'
  | 'owner_only'

export type CropSeason =
  | 'kharif'
  | 'rabi'
  | 'perennial'
  | 'other'

export type Crop = {
  id: string
  organizationId: string
  cropCode: string

  cropName: string
  season: CropSeason
  status: CropStatus

  landAssignmentId: string
  landId: string
  farmerId: string
  areaAcres: number

  landOwnershipType: LandOwnershipType
  cropShareType: CropShareType
  ownerSharePercentage: number
  farmerSharePercentage: number

  sowingDate: string
  expectedHarvestDate: string
  actualHarvestDate: string
  notes: string

  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type CreateCropInput = {
  organizationId: string

  cropName: string
  season: CropSeason
  status: CropStatus

  landAssignmentId: string
  landId: string
  farmerId: string
  areaAcres: number

  landOwnershipType: LandOwnershipType
  cropShareType: CropShareType
  ownerSharePercentage: number
  farmerSharePercentage: number

  sowingDate: string
  expectedHarvestDate: string
  actualHarvestDate: string
  notes: string
}

export type UpdateCropInput = CreateCropInput

export type CropSummary = {
  totalCrops: number
  plannedCrops: number
  activeCrops: number
  harvestedCrops: number
  closedCrops: number
  totalCropAcres: number
}