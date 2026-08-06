import type { Timestamp } from 'firebase/firestore'

export type PurchaseStatus =
  | 'unpaid'
  | 'partially_paid'
  | 'paid'
  | 'cancelled'

export type PurchaseCategory =
  | 'seed'
  | 'fertilizer'
  | 'pesticide'
  | 'equipment'
  | 'fuel'
  | 'irrigation'
  | 'labour'
  | 'other'

export type PurchaseUnit =
  | 'kg'
  | 'bag'
  | 'litre'
  | 'piece'
  | 'unit'
  | 'service'
  | 'other'

export type Purchase = {
  id: string

  organizationId: string
  purchaseCode: string

  supplierId: string
  cropId: string
  landId: string
  farmerId: string

  itemName: string
  category: PurchaseCategory

  quantity: number
  unit: PurchaseUnit
  unitPrice: number
  totalAmount: number

  paidAmount: number
  balanceAmount: number
  status: PurchaseStatus

  purchaseDate: string
  invoiceNumber: string
  notes: string

  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export type CreatePurchaseInput = {
  organizationId: string

  supplierId: string
  cropId: string
  landId: string
  farmerId: string

  itemName: string
  category: PurchaseCategory

  quantity: number
  unit: PurchaseUnit
  unitPrice: number
  totalAmount: number

  paidAmount: number
  balanceAmount: number
  status: PurchaseStatus

  purchaseDate: string
  invoiceNumber: string
  notes: string
}

export type UpdatePurchaseInput = CreatePurchaseInput

export type PurchaseSummary = {
  totalPurchases: number
  totalPurchaseAmount: number
  totalPaidAmount: number
  totalBalanceAmount: number
  unpaidPurchases: number
  partiallyPaidPurchases: number
  paidPurchases: number
}