import type { Timestamp } from 'firebase/firestore'

export type FarmerStatus = 'active' | 'archived'

export type Farmer = {
  id: string

  organizationId: string
  farmerCode: string

  farmerName: string
  casteName: string
  phoneNumber: string
  notes: string

  status: FarmerStatus
  assignedLandIds: string[]

  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type CreateFarmerInput = {
  organizationId?: string

  farmerName: string
  casteName: string
  phoneNumber: string
  notes: string
}

export type UpdateFarmerInput = CreateFarmerInput & {
  status?: FarmerStatus
  assignedLandIds?: string[]
}

export type FarmerSummary = {
  totalFarmers: number
  activeFarmers: number
  archivedFarmers: number
}