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
  CreateSupplierInput,
  Supplier,
  SupplierSummary,
  UpdateSupplierInput,
} from '../types/supplier'

const suppliersCollection = collection(db, 'suppliers')
const countersCollection = collection(db, 'counters')

function getSupplierCounterId(organizationId?: string) {
  return organizationId
    ? `suppliers_${organizationId}`
    : 'suppliers_global'
}

function formatSupplierCode(value: number) {
  return `SUPPLIER-${String(value).padStart(3, '0')}`
}

function mapSupplierDocument(
  supplierId: string,
  data: Record<string, unknown>,
): Supplier {
  return {
    id: supplierId,

    organizationId:
      typeof data.organizationId === 'string'
        ? data.organizationId
        : '',

    supplierCode:
      typeof data.supplierCode === 'string'
        ? data.supplierCode
        : 'SUPPLIER-000',

    supplierName:
      typeof data.supplierName === 'string'
        ? data.supplierName
        : '',

    businessName:
      typeof data.businessName === 'string'
        ? data.businessName
        : '',

    category:
      data.category === 'seed' ||
      data.category === 'fertilizer' ||
      data.category === 'pesticide' ||
      data.category === 'equipment' ||
      data.category === 'fuel'
        ? data.category
        : 'general',

    phoneNumber:
      typeof data.phoneNumber === 'string'
        ? data.phoneNumber
        : '',

    address:
      typeof data.address === 'string'
        ? data.address
        : '',

    notes:
      typeof data.notes === 'string'
        ? data.notes
        : '',

    status:
      data.status === 'archived'
        ? 'archived'
        : 'active',

    createdAt:
      data.createdAt &&
      typeof data.createdAt === 'object'
        ? (data.createdAt as Supplier['createdAt'])
        : null,

    updatedAt:
      data.updatedAt &&
      typeof data.updatedAt === 'object'
        ? (data.updatedAt as Supplier['updatedAt'])
        : null,
  }
}

export async function createSupplier(
  input: CreateSupplierInput,
): Promise<string> {
  const supplierReference = doc(suppliersCollection)
  const counterReference = doc(
    countersCollection,
    getSupplierCounterId(input.organizationId),
  )

  await runTransaction(db, async (transaction) => {
    const counterSnapshot =
      await transaction.get(counterReference)

    const currentValue = Number(
      counterSnapshot.data()?.value ?? 0,
    )

    const nextValue = currentValue + 1
    const supplierCode =
      formatSupplierCode(nextValue)

    transaction.set(
      counterReference,
      {
        value: nextValue,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )

    transaction.set(supplierReference, {
      organizationId: input.organizationId ?? '',
      supplierCode,

      supplierName: input.supplierName.trim(),
      businessName: input.businessName.trim(),
      category: input.category,

      phoneNumber: input.phoneNumber.trim(),
      address: input.address.trim(),
      notes: input.notes.trim(),

      status: input.status,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  })

  return supplierReference.id
}

export async function getSuppliers(
  organizationId?: string,
): Promise<Supplier[]> {
  const suppliersQuery = query(
    suppliersCollection,
    orderBy('createdAt', 'desc'),
  )

  const snapshot = await getDocs(suppliersQuery)

  const suppliers = snapshot.docs.map(
    (supplierDocument) =>
      mapSupplierDocument(
        supplierDocument.id,
        supplierDocument.data(),
      ),
  )

  if (!organizationId) {
    return suppliers
  }

  return suppliers.filter(
    (supplier) =>
      supplier.organizationId === organizationId,
  )
}

export async function getSupplierById(
  supplierId: string,
): Promise<Supplier | null> {
  const supplierReference = doc(
    db,
    'suppliers',
    supplierId,
  )

  const snapshot = await getDoc(supplierReference)

  if (!snapshot.exists()) {
    return null
  }

  return mapSupplierDocument(
    snapshot.id,
    snapshot.data(),
  )
}

export async function updateSupplier(
  supplierId: string,
  input: UpdateSupplierInput,
) {
  const supplierReference = doc(
    db,
    'suppliers',
    supplierId,
  )

  await updateDoc(supplierReference, {
    organizationId: input.organizationId ?? '',

    supplierName: input.supplierName.trim(),
    businessName: input.businessName.trim(),
    category: input.category,

    phoneNumber: input.phoneNumber.trim(),
    address: input.address.trim(),
    notes: input.notes.trim(),

    status: input.status,

    updatedAt: serverTimestamp(),
  })
}

export async function archiveSupplier(
  supplierId: string,
) {
  const supplierReference = doc(
    db,
    'suppliers',
    supplierId,
  )

  await updateDoc(supplierReference, {
    status: 'archived',
    updatedAt: serverTimestamp(),
  })
}

export async function restoreSupplier(
  supplierId: string,
) {
  const supplierReference = doc(
    db,
    'suppliers',
    supplierId,
  )

  await updateDoc(supplierReference, {
    status: 'active',
    updatedAt: serverTimestamp(),
  })
}

/**
 * Use only for a supplier entered by mistake.
 *
 * After the Purchases module is connected, deletion
 * should be allowed only when the supplier has no
 * linked purchase or payment records.
 */
export async function deleteSupplier(
  supplierId: string,
) {
  const supplierReference = doc(
    db,
    'suppliers',
    supplierId,
  )

  await deleteDoc(supplierReference)
}

export function calculateSupplierSummary(
  suppliers: Supplier[],
): SupplierSummary {
  return suppliers.reduce<SupplierSummary>(
    (summary, supplier) => {
      summary.totalSuppliers += 1

      if (supplier.status === 'active') {
        summary.activeSuppliers += 1
      }

      if (supplier.status === 'archived') {
        summary.archivedSuppliers += 1
      }

      return summary
    },
    {
      totalSuppliers: 0,
      activeSuppliers: 0,
      archivedSuppliers: 0,
    },
  )
}