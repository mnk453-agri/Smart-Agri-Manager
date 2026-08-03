import type { Timestamp } from 'firebase/firestore'

export type UserRole = 'owner' | 'manager' | 'farmer'

export type PreferredLanguage = 'en' | 'ur'

export type UserAccount = {
  uid: string
  fullName: string
  phoneNumber: string
  email: string
  country: string
  agricultureBusinessName: string
  preferredLanguage: PreferredLanguage
  profileCompleted: boolean
  isActive: boolean
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type Organization = {
  id: string
  name: string
  currency: 'PKR'
  landUnit: 'Acres'
  defaultLanguage: PreferredLanguage
  setupCompleted: boolean
  createdBy: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type OrganizationMembership = {
  id: string
  organizationId: string
  userId: string
  role: UserRole
  linkedFarmerId: string | null
  isActive: boolean
  invitedBy: string | null
  joinedAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type ActiveWorkspace = {
  organization: Organization
  membership: OrganizationMembership
}

export type RegisterAccountInput = {
  fullName: string
  phoneNumber: string
  email: string
  password: string
  preferredLanguage: PreferredLanguage
}

export type CompleteProfileInput = {
  fullName: string
  phoneNumber: string
  country: string
  agricultureBusinessName: string
  preferredLanguage: PreferredLanguage
}

export type CreateWorkspaceInput = {
  organizationName: string
  defaultLanguage: PreferredLanguage
}

export type LoginInput = {
  email: string
  password: string
}