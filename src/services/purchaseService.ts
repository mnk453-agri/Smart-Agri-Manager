import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  CreatePurchaseInput,
  Purchase,
  PurchaseCategory,
  PurchaseStatus,
  PurchaseSummary,
  PurchaseUnit,
  UpdatePurchaseInput,
} from '../types/purchase'

const purchasesCollection = collection(db, 'purchases')
const countersCollection = collection(db, 'counters')

function getPurchaseCounterId(organizationId?: string) {
  return organizationId
    ? `purchases_${organizationId}`
    : 'purchases_global'
}

function formatPurchaseCode(value: number) {
  return `PURCHASE-${String(value).padStart(3, '0')}`
}

function normalizeAmount(value: unknown) {
  const amount = Number(value)

  if (!Number.isFinite(amount) || amount < 0) {
    return 0
  }

  return amount
}

function normalizeCategory(
  value: unknown,
): PurchaseCategory {
  if (
    value === 'seed' ||
    value === 'fertilizer' ||
    value === 'pesticide' ||
    value === 'equipment' ||
    value === 'fuel' ||
    value === 'irrigation' ||
    value === 'labour'
  ) {
    return value
  }

  return 'other'
}

function normalizeUnit(value: unknown): PurchaseUnit {
  if (
    value === 'kg' ||
    value === 'bag' ||
    value === 'litre' ||
    value === 'piece' ||
    value === 'unit' ||
    value === 'service'
  ) {
    return value
  }

  return 'other'
}

function calculateStatus(
  totalAmount: number,
  paidAmount: number,
  requestedStatus?: PurchaseStatus,
): PurchaseStatus {
  if (requestedStatus === 'cancelled') {
    return 'cancelled'
  }

  if (totalAmount <= 0 || paidAmount <= 0) {
    return 'unpaid'
  }

  if (paidAmount >= totalAmount) {
    return 'paid'
  }

  return 'partially_paid'
}

function calculateFinancialValues(
  input: CreatePurchaseInput | UpdatePurchaseInput,
) {
  const quantity = normalizeAmount(input.quantity)
  const unitPrice = normalizeAmount(input.unitPrice)

  const calculatedTotal = quantity * unitPrice
  const suppliedTotal = normalizeAmount(
    input.totalAmount,
  )

  const totalAmount =
    calculatedTotal > 0
      ? calculatedTotal
      : suppliedTotal

  const requestedPaidAmount = normalizeAmount(
    input.paidAmount,
  )

  const paidAmount = Math.min(
    requestedPaidAmount,
    totalAmount,
  )

  const balanceAmount = Math.max(
    totalAmount - paidAmount,
    0,
  )

  const status = calculateStatus(
    totalAmount,
    paidAmount,
    input.status,
  )

  return {
    quantity,
    unitPrice,
    totalAmount,
    paidAmount,
    balanceAmount,
    status,
  }
}

function mapPurchaseDocument(
  purchaseId: string,
  data: Record<string, unknown>,
): Purchase {
  const totalAmount = normalizeAmount(data.totalAmount)
  const paidAmount = Math.min(
    normalizeAmount(data.paidAmount),
    totalAmount,
  )

  const balanceAmount = Math.max(
    totalAmount - paidAmount,
    0,
  )

  const status = calculateStatus(
    totalAmount,
    paidAmount,
    data.status === 'cancelled'
      ? 'cancelled'
      : undefined,
  )

  return {
    id: purchaseId,

    organizationId:
      typeof data.organizationId === 'string'
        ? data.organizationId
        : '',

    purchaseCode:
      typeof data.purchaseCode === 'string'
        ? data.purchaseCode
        : 'PURCHASE-000',

    supplierId:
      typeof data.supplierId === 'string'
        ? data.supplierId
        : '',

    cropId:
      typeof data.cropId === 'string'
        ? data.cropId
        : '',

    landId:
      typeof data.landId === 'string'
        ? data.landId
        : '',

    farmerId:
      typeof data.farmerId === 'string'
        ? data.farmerId
        : '',

    itemName:
      typeof data.itemName === 'string'
        ? data.itemName
        : '',

    category: normalizeCategory(data.category),

    quantity: normalizeAmount(data.quantity),
    unit: normalizeUnit(data.unit),
    unitPrice: normalizeAmount(data.unitPrice),

    totalAmount,
    paidAmount,
    balanceAmount,
    status,

    purchaseDate:
      typeof data.purchaseDate === 'string'
        ? data.purchaseDate
        : '',

    invoiceNumber:
      typeof data.invoiceNumber === 'string'
        ? data.invoiceNumber
        : '',

    notes:
      typeof data.notes === 'string'
        ? data.notes
        : '',

    createdAt:
      data.createdAt &&
      typeof data.createdAt === 'object'
        ? (data.createdAt as Purchase['createdAt'])
        : null,

    updatedAt:
      data.updatedAt &&
      typeof data.updatedAt === 'object'
        ? (data.updatedAt as Purchase['updatedAt'])
        : null,
  }
}

export async function createPurchase(
  input: CreatePurchaseInput,
): Promise<string> {
  const purchaseReference = doc(purchasesCollection)

  const counterReference = doc(
    countersCollection,
    getPurchaseCounterId(input.organizationId),
  )

  const financialValues =
    calculateFinancialValues(input)

  await runTransaction(db, async (transaction) => {
    const counterSnapshot =
      await transaction.get(counterReference)

    const currentValue = Number(
      counterSnapshot.data()?.value ?? 0,
    )

    const nextValue = currentValue + 1
    const purchaseCode =
      formatPurchaseCode(nextValue)

    transaction.set(
      counterReference,
      {
        value: nextValue,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    transaction.set(purchaseReference, {
      organizationId: input.organizationId,

      purchaseCode,

      supplierId: input.supplierId,
      cropId: input.cropId,
      landId: input.landId,
      farmerId: input.farmerId,

      itemName: input.itemName.trim(),
      category: input.category,

      quantity: financialValues.quantity,
      unit: input.unit,
      unitPrice: financialValues.unitPrice,

      totalAmount: financialValues.totalAmount,
      paidAmount: financialValues.paidAmount,
      balanceAmount: financialValues.balanceAmount,
      status: financialValues.status,

      purchaseDate: input.purchaseDate,
      invoiceNumber: input.invoiceNumber.trim(),
      notes: input.notes.trim(),

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })

  return purchaseReference.id
}

export async function getPurchases(
  organizationId?: string,
): Promise<Purchase[]> {
  const purchasesQuery = query(
    purchasesCollection,
    orderBy('createdAt', 'desc'),
  )

  const snapshot = await getDocs(purchasesQuery)

  const purchases = snapshot.docs.map(
    (purchaseDocument) =>
      mapPurchaseDocument(
        purchaseDocument.id,
        purchaseDocument.data(),
      ),
  )

  if (!organizationId) {
    return purchases
  }

  return purchases.filter(
    (purchase) =>
      purchase.organizationId === organizationId,
  )
}

export async function getPurchaseById(
  purchaseId: string,
): Promise<Purchase | null> {
  const purchaseReference = doc(
    db,
    'purchases',
    purchaseId,
  )

  const snapshot = await getDoc(purchaseReference)

  if (!snapshot.exists()) {
    return null
  }

  return mapPurchaseDocument(
    snapshot.id,
    snapshot.data(),
  )
}

export async function updatePurchase(
  purchaseId: string,
  input: UpdatePurchaseInput,
) {
  const purchaseReference = doc(
    db,
    'purchases',
    purchaseId,
  )

  const financialValues =
    calculateFinancialValues(input)

  await updateDoc(purchaseReference, {
    organizationId: input.organizationId,

    supplierId: input.supplierId,
    cropId: input.cropId,
    landId: input.landId,
    farmerId: input.farmerId,

    itemName: input.itemName.trim(),
    category: input.category,

    quantity: financialValues.quantity,
    unit: input.unit,
    unitPrice: financialValues.unitPrice,

    totalAmount: financialValues.totalAmount,
    paidAmount: financialValues.paidAmount,
    balanceAmount: financialValues.balanceAmount,
    status: financialValues.status,

    purchaseDate: input.purchaseDate,
    invoiceNumber: input.invoiceNumber.trim(),
    notes: input.notes.trim(),

    updatedAt: serverTimestamp(),
  })
}

export async function cancelPurchase(
  purchaseId: string,
) {
  const purchaseReference = doc(
    db,
    'purchases',
    purchaseId,
  )

  await updateDoc(purchaseReference, {
    status: 'cancelled',
    updatedAt: serverTimestamp(),
  })
}

/**
 * Use only for a purchase entered by mistake.
 *
 * After supplier payments and inventory records are
 * connected, deletion should be allowed only when the
 * purchase has no linked payment or stock activity.
 */
export async function deletePurchase(
  purchaseId: string,
) {
  const purchaseReference = doc(
    db,
    'purchases',
    purchaseId,
  )

  await deleteDoc(purchaseReference)
}

export function calculatePurchaseSummary(
  purchases: Purchase[],
): PurchaseSummary {
  return purchases.reduce<PurchaseSummary>(
    (summary, purchase) => {
      if (purchase.status === 'cancelled') {
        return summary
      }

      summary.totalPurchases += 1
      summary.totalPurchaseAmount +=
        purchase.totalAmount
      summary.totalPaidAmount +=
        purchase.paidAmount
      summary.totalBalanceAmount +=
        purchase.balanceAmount

      if (purchase.status === 'unpaid') {
        summary.unpaidPurchases += 1
      }

      if (purchase.status === 'partially_paid') {
        summary.partiallyPaidPurchases += 1
      }

      if (purchase.status === 'paid') {
        summary.paidPurchases += 1
      }

      return summary
    },
    {
      totalPurchases: 0,
      totalPurchaseAmount: 0,
      totalPaidAmount: 0,
      totalBalanceAmount: 0,
      unpaidPurchases: 0,
      partiallyPaidPurchases: 0,
      paidPurchases: 0,
    },
  )
}