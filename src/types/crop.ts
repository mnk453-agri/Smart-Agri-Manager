import type { Timestamp } from 'firebase/firestore'

export type CropStatus =
  | 'planned'
  | 'active'
  | 'harvested'
  | 'closed'

export type CropShareType =
  | 'owner_only'
  | 'shared_with_farmer'

export type CropSeason =
  | 'kharif'
  | 'rabi'
  | 'perennial'
  | 'other'

export type Crop = {
  id: string
  cropName: string
  landId: string
  farmerId: string
  areaAcres: number
  sowingDate: string
  expectedHarvestDate: string
  actualHarvestDate: string
  season: CropSeason
  shareType: CropShareType
  status: CropStatus
  notes: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type CreateCropInput = {
  cropName: string
  landId: string
  farmerId: string
  areaAcres: number
  sowingDate: string
  expectedHarvestDate: string
  actualHarvestDate: string
  season: CropSeason
  shareType: CropShareType
  status: CropStatus
  notes: string
}