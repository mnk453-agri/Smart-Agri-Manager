import type { Timestamp } from 'firebase/firestore'

export type LandOwnershipType = 'owned' | 'leased'
export type LandStatus = 'active' | 'archived'

export type Land = {
  id: string
  organizationId: string
  landCode: string

  landName: string
  location: string
  totalAcres: number
  ownership: LandOwnershipType
  soilType: string
  annualLeaseAmount: number
  notes: string

  status: LandStatus
  assignedFarmerId: string

  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type CreateLandInput = {
  organizationId?: string
  landName: string
  location: string
  totalAcres: number
  ownership: LandOwnershipType
  soilType: string
  annualLeaseAmount: number
  notes: string
}

export type UpdateLandInput = CreateLandInput & {
  status?: LandStatus
  assignedFarmerId?: string
}

export type LandSummary = {
  totalLandSites: number
  totalLandAcres: number
  ownedLandAcres: number
  leasedLandAcres: number
}