import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type {
  CreateLandAssignmentInput,
  LandAssignment,
  LandAssignmentSummary,
} from '../types/landAssignment'

const landAssignmentsCollection = collection(
  db,
  'landAssignments',
)

export async function createLandAssignment(
  input: CreateLandAssignmentInput,
): Promise<string> {
  const documentReference = await addDoc(
    landAssignmentsCollection,
    {
      organizationId: input.organizationId,
      landId: input.landId,
      farmerId: input.farmerId,
      assignedAcres: Number(input.assignedAcres),
      startDate: input.startDate,
      endDate: input.endDate,
      status: input.status,
      notes: input.notes.trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  )

  return documentReference.id
}

export async function getLandAssignments(
  organizationId?: string,
): Promise<LandAssignment[]> {
  const assignmentsQuery = query(
    landAssignmentsCollection,
    orderBy('createdAt', 'desc'),
  )

  const snapshot = await getDocs(assignmentsQuery)

  const assignments = snapshot.docs.map(
    (assignmentDocument) => {
      const data = assignmentDocument.data()

      return {
        id: assignmentDocument.id,
        organizationId: data.organizationId ?? '',
        landId: data.landId ?? '',
        farmerId: data.farmerId ?? '',
        assignedAcres: Number(data.assignedAcres ?? 0),
        startDate: data.startDate ?? '',
        endDate: data.endDate ?? '',
        status: data.status ?? 'active',
        notes: data.notes ?? '',
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      } satisfies LandAssignment
    },
  )

  if (!organizationId) {
    return assignments
  }

  return assignments.filter(
    (assignment) =>
      assignment.organizationId === organizationId,
  )
}

export async function updateLandAssignment(
  assignmentId: string,
  input: CreateLandAssignmentInput,
) {
  const assignmentReference = doc(
    db,
    'landAssignments',
    assignmentId,
  )

  await updateDoc(assignmentReference, {
    organizationId: input.organizationId,
    landId: input.landId,
    farmerId: input.farmerId,
    assignedAcres: Number(input.assignedAcres),
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status,
    notes: input.notes.trim(),
    updatedAt: serverTimestamp(),
  })
}

export async function closeLandAssignment(
  assignmentId: string,
  endDate: string,
) {
  const assignmentReference = doc(
    db,
    'landAssignments',
    assignmentId,
  )

  await updateDoc(assignmentReference, {
    status: 'closed',
    endDate,
    updatedAt: serverTimestamp(),
  })
}

export async function reopenLandAssignment(
  assignmentId: string,
) {
  const assignmentReference = doc(
    db,
    'landAssignments',
    assignmentId,
  )

  await updateDoc(assignmentReference, {
    status: 'active',
    endDate: '',
    updatedAt: serverTimestamp(),
  })
}

/**
 * Use only for a mistaken assignment that has no linked
 * crops, expenses, sales, advances, or settlements.
 */
export async function deleteLandAssignment(
  assignmentId: string,
) {
  const assignmentReference = doc(
    db,
    'landAssignments',
    assignmentId,
  )

  await deleteDoc(assignmentReference)
}

export function calculateAssignmentSummary(
  assignments: LandAssignment[],
): LandAssignmentSummary {
  const totalAssignments = assignments.length

  const activeAssignments = assignments.filter(
    (assignment) => assignment.status === 'active',
  ).length

  const closedAssignments =
    totalAssignments - activeAssignments

  const totalAssignedAcres = assignments
    .filter(
      (assignment) => assignment.status === 'active',
    )
    .reduce(
      (total, assignment) =>
        total + assignment.assignedAcres,
      0,
    )

  return {
    totalAssignments,
    activeAssignments,
    closedAssignments,
    totalAssignedAcres,
  }
}

export function calculateActiveAssignedAcres(
  assignments: LandAssignment[],
  landId: string,
  excludedAssignmentId?: string,
) {
  return assignments
    .filter(
      (assignment) =>
        assignment.landId === landId &&
        assignment.status === 'active' &&
        assignment.id !== excludedAssignmentId,
    )
    .reduce(
      (total, assignment) =>
        total + assignment.assignedAcres,
      0,
    )
}

export function calculateAvailableLandAcres(
  totalLandAcres: number,
  assignments: LandAssignment[],
  landId: string,
  excludedAssignmentId?: string,
) {
  const alreadyAssignedAcres =
    calculateActiveAssignedAcres(
      assignments,
      landId,
      excludedAssignmentId,
    )

  return Math.max(
    totalLandAcres - alreadyAssignedAcres,
    0,
  )
}