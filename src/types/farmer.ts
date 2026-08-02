import type { Timestamp } from 'firebase/firestore'

export type FarmerStatus = 'active' | 'inactive'

export type Farmer = {
  id: string
  farmerName: string
  casteName: string
  phoneNumber: string
  status: FarmerStatus
  notes: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type CreateFarmerInput = {
  farmerName: string
  casteName: string
  phoneNumber: string
  status: FarmerStatus
  notes: string
}