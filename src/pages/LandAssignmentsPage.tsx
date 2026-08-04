import { useEffect, useMemo, useState } from 'react'
import {
  ClipboardList,
  LoaderCircle,
  MapIcon,
  Pencil,
  Plus,
  Search,
  Sprout,
  Trash2,
  Users,
} from 'lucide-react'
import LandAssignmentFormModal from '../components/LandAssignmentFormModal'
import { useAuth } from '../contexts/AuthContext'
import { getFarmers } from '../services/farmerService'
import {
  calculateAssignmentSummary,
  createLandAssignment,
  deleteLandAssignment,
  getLandAssignments,
  updateLandAssignment,
} from '../services/landAssignmentService'
import { getLands } from '../services/landService'
import type { Farmer } from '../types/farmer'
import type { Land } from '../types/land'
import type {
  CreateLandAssignmentInput,
  LandAssignment,
} from '../types/landAssignment'

function formatAcres(value: number) {
  return `${value.toLocaleString()} Acres`
}

function formatDate(value: string) {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function LandAssignmentsPage() {
  const { activeWorkspace } = useAuth()

  const [assignments, setAssignments] = useState<
    LandAssignment[]
  >([])
  const [lands, setLands] = useState<Land[]>([])
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] =
    useState<LandAssignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [
  deletingAssignmentId,
  setDeletingAssignmentId,
] = useState<string | null>(null)

  const organizationId =
    activeWorkspace?.organization.id ?? ''

  const loadPageData = async () => {
    try {
      setIsLoading(true)
      setPageError('')

      const [
        assignmentRecords,
        landRecords,
        farmerRecords,
      ] = await Promise.all([
        organizationId
          ? getLandAssignments(organizationId)
          : getLandAssignments(),
        organizationId
          ? getLands(organizationId)
          : getLands(),
        organizationId
          ? getFarmers(organizationId)
          : getFarmers(),
      ])

      setAssignments(assignmentRecords)
      setLands(landRecords)
      setFarmers(farmerRecords)
    } catch (error) {
      console.error(
        'Unable to load land-assignment data:',
        error,
      )

      setPageError(
        'Unable to load land assignments. Please check Firestore and try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPageData()
  }, [organizationId])

  const summary = useMemo(
    () => calculateAssignmentSummary(assignments),
    [assignments],
  )

  const landById = useMemo(
    () =>
      new Map(
        lands.map((land) => [land.id, land]),
      ),
    [lands],
  )

  const farmerById = useMemo(
    () =>
      new Map(
        farmers.map((farmer) => [
          farmer.id,
          farmer,
        ]),
      ),
    [farmers],
  )

  const filteredAssignments = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase()

    if (!normalizedSearch) {
      return assignments
    }

    return assignments.filter((assignment) => {
      const land = landById.get(assignment.landId)
      const farmer = farmerById.get(
        assignment.farmerId,
      )

      const landLabel =
        land?.landName ||
        land?.location ||
        land?.landCode ||
        ''

      return [
        landLabel,
        farmer?.farmerName ?? '',
        assignment.status,
        assignment.notes,
      ].some((value) =>
        value
          .toLowerCase()
          .includes(normalizedSearch),
      )
    })
  }, [
    assignments,
    searchTerm,
    landById,
    farmerById,
  ])

  const summaryCards = [
    {
      title: 'Total Assignments',
      value: summary.totalAssignments,
      description: 'All assignment records',
      icon: ClipboardList,
      style: 'bg-sky-100 text-sky-700',
    },
    {
      title: 'Active Assignments',
      value: summary.activeAssignments,
      description: 'Currently active assignments',
      icon: Sprout,
      style: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Closed Assignments',
      value: summary.closedAssignments,
      description: 'Completed assignment records',
      icon: Users,
      style: 'bg-slate-200 text-slate-700',
    },
    {
      title: 'Assigned Land',
      value: formatAcres(
        summary.totalAssignedAcres,
      ),
      description: 'Total assigned acreage',
      icon: MapIcon,
      style: 'bg-violet-100 text-violet-700',
    },
  ]

  const openAddForm = () => {
    setEditingAssignment(null)
    setIsFormOpen(true)
  }

  const openEditForm = (
    assignment: LandAssignment,
  ) => {
    setEditingAssignment(assignment)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingAssignment(null)
  }

  const handleSubmit = async (
    input: CreateLandAssignmentInput,
  ) => {
    const inputWithWorkspace: CreateLandAssignmentInput = {
      ...input,
      organizationId,
    }

    if (editingAssignment) {
      await updateLandAssignment(
        editingAssignment.id,
        inputWithWorkspace,
      )
    } else {
      await createLandAssignment(
        inputWithWorkspace,
      )
    }

    await loadPageData()
  }
  const handleDelete = async (
    assignment: LandAssignment,
  ) => {
    if (deletingAssignmentId) {
      return
    }

    const land =
      landById.get(assignment.landId)
    const farmer =
      farmerById.get(assignment.farmerId)

    const landName =
      land?.landName || 'this land'
    const farmerName =
      farmer?.farmerName || 'this farmer'

    const confirmed = window.confirm(
      `Permanently delete the ${assignment.assignedAcres.toLocaleString()}-acre assignment of ${landName} to ${farmerName}?\n\nOnly continue if no crop, expense, sale, advance, or settlement is linked to this assignment.`,
    )

    if (!confirmed) {
      return
    }

    setDeletingAssignmentId(assignment.id)
    setPageError('')

    try {
      await deleteLandAssignment(assignment.id)
      await loadPageData()
    } catch (error) {
      console.error(
        'Unable to delete land assignment:',
        error,
      )
      setPageError(
        'Unable to delete the land assignment. Please try again.',
      )
    } finally {
      setDeletingAssignmentId(null)
    }
  }
  return (
    <>
      <div className="space-y-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              Farm Setup
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Land Assignments
            </h1>

            <p className="mt-2 text-slate-500">
              Assign land areas to farmers and manage
              assignment history.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            <Plus className="h-5 w-5" />
            Add Assignment
          </button>
        </section>

        {pageError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {pageError}
          </div>
        )}

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon

            return (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div
                  className={`grid h-11 w-11 place-items-center rounded-xl ${card.style}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <p className="mt-5 text-sm font-medium text-slate-500">
                  {card.title}
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {card.value}
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {card.description}
                </p>
              </div>
            )
          })}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Assignment Records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredAssignments.length} displayed
                record
                {filteredAssignments.length === 1
                  ? ''
                  : 's'}
              </p>
            </div>

            <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5 sm:w-80">
              <Search className="h-5 w-5 text-slate-400" />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search assignments..."
                className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    'Land',
                    'Farmer',
                    'Assigned Acres',
                    'Start Date',
                    'End Date',
                    'Status',
                    'Actions',
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center"
                    >
                      <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-emerald-700" />

                      <p className="mt-3 text-sm text-slate-500">
                        Loading assignment records...
                      </p>
                    </td>
                  </tr>
                ) : filteredAssignments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center"
                    >
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                        <ClipboardList className="h-7 w-7" />
                      </div>

                      <h3 className="mt-4 font-bold text-slate-900">
                        No assignment records yet
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        Use Add Assignment whenever you are
                        ready.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredAssignments.map(
                    (assignment) => {
                      const land = landById.get(
                        assignment.landId,
                      )

                      const farmer = farmerById.get(
                        assignment.farmerId,
                      )

                      const landLabel =
                        land?.landName ||
                        land?.location ||
                        land?.landCode ||
                        'Unknown Land'

                      return (
                        <tr
                          key={assignment.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4 font-semibold text-slate-900">
                            {landLabel}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {farmer?.farmerName ||
                              'Unknown Farmer'}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-900">
                            {formatAcres(
                              assignment.assignedAcres,
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                            {formatDate(
                              assignment.startDate,
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                            {formatDate(
                              assignment.endDate,
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <span
                              className={[
                                'inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize',
                                assignment.status ===
                                'active'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-200 text-slate-600',
                              ].join(' ')}
                            >
                              {assignment.status}
                            </span>
                          </td>

                         <td className="whitespace-nowrap px-5 py-4">
  <div className="flex items-center gap-1">
    <button
      type="button"
      aria-label="Edit assignment"
      onClick={() =>
        openEditForm(assignment)
      }
      disabled={Boolean(deletingAssignmentId)}
      className="rounded-lg p-2 text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Pencil className="h-4 w-4" />
    </button>

    <button
      type="button"
      aria-label="Delete assignment"
      onClick={() =>
        void handleDelete(assignment)
      }
      disabled={Boolean(deletingAssignmentId)}
      className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {deletingAssignmentId ===
      assignment.id ? (
        <LoaderCircle className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  </div>
</td>
                        </tr>
                      )
                    },
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <LandAssignmentFormModal
        isOpen={isFormOpen}
        assignment={editingAssignment}
        organizationId={organizationId}
        lands={lands}
        farmers={farmers}
        existingAssignments={assignments}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />
    </>
  )
}

export default LandAssignmentsPage