import type { Timestamp } from 'firebase/firestore'

export type SupplierStatus = 'active' | 'archived'

export type SupplierCategory =
  | 'seed'
  | 'fertilizer'
  | 'pesticide'
  | 'equipment'
  | 'fuel'
  | 'general'

export type Supplier = {
  id: string

  organizationId: string
  supplierCode: string

  supplierName: string
  businessName: string
  category: SupplierCategory

  phoneNumber: string
  address: string
  notes: string

  status: SupplierStatus

  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type CreateSupplierInput = {
  organizationId?: string

  supplierName: string
  businessName: string
  category: SupplierCategory

  phoneNumber: string
  address: string
  notes: string

  status: SupplierStatus
}

export type UpdateSupplierInput = CreateSupplierInput

export type SupplierSummary = {
  totalSuppliers: number
  activeSuppliers: number
  archivedSuppliers: number
}