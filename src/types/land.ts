import type { Timestamp } from 'firebase/firestore'

export type LandOwnership = 'owned' | 'leased'

export type Land = {
  id: string
  landName: string
  location: string
  totalAcres: number
  ownership: LandOwnership
  soilType: string
  annualLeaseAmount: number
  notes: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type CreateLandInput = {
  landName: string
  location: string
  totalAcres: number
  ownership: LandOwnership
  soilType: string
  annualLeaseAmount: number
  notes: string
}