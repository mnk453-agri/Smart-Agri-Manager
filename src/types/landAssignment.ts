import type { Timestamp } from 'firebase/firestore'

export type LandAssignmentStatus = 'active' | 'closed'

export type LandAssignment = {
  id: string
  organizationId: string
  landId: string
  farmerId: string
  assignedAcres: number
  startDate: string
  endDate: string
  status: LandAssignmentStatus
  notes: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type CreateLandAssignmentInput = {
  organizationId: string
  landId: string
  farmerId: string
  assignedAcres: number
  startDate: string
  endDate: string
  status: LandAssignmentStatus
  notes: string
}