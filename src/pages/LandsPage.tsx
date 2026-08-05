import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Archive,
  Building2,
  LoaderCircle,
  Map as MapIcon,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sprout,
} from 'lucide-react'
import LandFormModal from '../components/LandFormModal'
import { useAuth } from '../contexts/AuthContext'
import { getCrops } from '../services/cropService'
import { getFarmers } from '../services/farmerService'
import { getLandAssignments } from '../services/landAssignmentService'
import {
  archiveLand,
  createLand,
  getLands,
  restoreLand,
  updateLand,
} from '../services/landService'
import type { Crop } from '../types/crop'
import type {
  CreateLandInput,
  Land,
  LandOwnershipType,
  LandStatus,
} from '../types/land'
import type { Farmer } from '../types/farmer'
import type { LandAssignment } from '../types/landAssignment'

type OwnershipFilter =
  | 'all'
  | LandOwnershipType

type StatusFilter =
  | 'all'
  | LandStatus

type LandActivity = {
  assignmentCount: number
  assignedAcres: number
  cropCount: number
  cropAcres: number
  assignedBalanceAcres: number
  unassignedAcres: number
  farmerNames: string[]
  cropNames: string[]
}

const emptyActivity: LandActivity = {
  assignmentCount: 0,
  assignedAcres: 0,
  cropCount: 0,
  cropAcres: 0,
  assignedBalanceAcres: 0,
  unassignedAcres: 0,
  farmerNames: [],
  cropNames: [],
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatAcres(value: number) {
  return `${value.toLocaleString()} Acres`
}

function LandsPage() {
  const { activeWorkspace } = useAuth()

  const [lands, setLands] = useState<
    Land[]
  >([])
  const [farmers, setFarmers] = useState<
    Farmer[]
  >([])
  const [assignments, setAssignments] =
    useState<LandAssignment[]>([])
  const [crops, setCrops] = useState<
    Crop[]
  >([])

  const [searchTerm, setSearchTerm] =
    useState('')
  const [
    ownershipFilter,
    setOwnershipFilter,
  ] = useState<OwnershipFilter>('all')
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('active')

  const [isFormOpen, setIsFormOpen] =
    useState(false)
  const [editingLand, setEditingLand] =
    useState<Land | null>(null)
  const [isLoading, setIsLoading] =
    useState(true)
  const [pageError, setPageError] =
    useState('')

  const organizationId =
    activeWorkspace?.organization.id ?? ''

  const loadPageData = async () => {
    try {
      setIsLoading(true)
      setPageError('')

      const [
        landRecords,
        farmerRecords,
        assignmentRecords,
        cropRecords,
      ] = await Promise.all([
        organizationId
          ? getLands(organizationId)
          : getLands(),
        organizationId
          ? getFarmers(organizationId)
          : getFarmers(),
        organizationId
          ? getLandAssignments(
              organizationId,
            )
          : getLandAssignments(),
        organizationId
          ? getCrops(organizationId)
          : getCrops(),
      ])

      setLands(landRecords)
      setFarmers(farmerRecords)
      setAssignments(assignmentRecords)
      setCrops(cropRecords)
    } catch (error) {
      console.error(
        'Unable to load current land activity:',
        error,
      )

      setPageError(
        'Unable to load land records and current activity.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPageData()
  }, [organizationId])

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

  const activityByLand = useMemo(() => {
    const activityMap = new Map<
      string,
      {
        assignmentCount: number
        assignedAcres: number
        cropCount: number
        cropAcres: number
        farmerNames: Set<string>
        cropNames: Set<string>
      }
    >()

    assignments
      .filter(
        (assignment) =>
          assignment.status === 'active',
      )
      .forEach((assignment) => {
        const current =
          activityMap.get(
            assignment.landId,
          ) ?? {
            assignmentCount: 0,
            assignedAcres: 0,
            cropCount: 0,
            cropAcres: 0,
            farmerNames: new Set<string>(),
            cropNames: new Set<string>(),
          }

        current.assignmentCount += 1
        current.assignedAcres +=
          assignment.assignedAcres

        const farmer = farmerById.get(
          assignment.farmerId,
        )

        if (farmer?.farmerName) {
          current.farmerNames.add(
            farmer.farmerName,
          )
        }

        activityMap.set(
          assignment.landId,
          current,
        )
      })

    crops
      .filter(
        (crop) =>
          crop.status === 'planned' ||
          crop.status === 'active',
      )
      .forEach((crop) => {
        const current =
          activityMap.get(crop.landId) ?? {
            assignmentCount: 0,
            assignedAcres: 0,
            cropCount: 0,
            cropAcres: 0,
            farmerNames: new Set<string>(),
            cropNames: new Set<string>(),
          }

        current.cropCount += 1
        current.cropAcres += crop.areaAcres

        if (crop.cropName) {
          current.cropNames.add(
            crop.cropName,
          )
        }

        activityMap.set(
          crop.landId,
          current,
        )
      })

    return new Map(
      lands.map((land) => {
        const current =
          activityMap.get(land.id)

        const assignedAcres =
          current?.assignedAcres ?? 0
        const cropAcres =
          current?.cropAcres ?? 0

        return [
          land.id,
          {
            assignmentCount:
              current?.assignmentCount ?? 0,
            assignedAcres,
            cropCount:
              current?.cropCount ?? 0,
            cropAcres,
            assignedBalanceAcres: Math.max(
              assignedAcres - cropAcres,
              0,
            ),
            unassignedAcres: Math.max(
              land.totalAcres -
                assignedAcres,
              0,
            ),
            farmerNames: Array.from(
              current?.farmerNames ?? [],
            ),
            cropNames: Array.from(
              current?.cropNames ?? [],
            ),
          } satisfies LandActivity,
        ]
      }),
    )
  }, [
    assignments,
    crops,
    farmerById,
    lands,
    ])

  const currentTotals = useMemo(
    () =>
      lands
        .filter(
          (land) =>
            land.status === 'active',
        )
        .reduce(
          (totals, land) => {
            const activity =
              activityByLand.get(
                land.id,
              ) ?? emptyActivity

            return {
              totalLandAcres:
                totals.totalLandAcres +
                land.totalAcres,
              assignedAcres:
                totals.assignedAcres +
                activity.assignedAcres,
              cropAcres:
                totals.cropAcres +
                activity.cropAcres,
              unassignedAcres:
                totals.unassignedAcres +
                activity.unassignedAcres,
            }
          },
          {
            totalLandAcres: 0,
            assignedAcres: 0,
            cropAcres: 0,
            unassignedAcres: 0,
          },
        ),
    [activityByLand, lands],
  )

  const filteredLands = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase()

    return lands.filter((land) => {
      const activity =
        activityByLand.get(land.id) ??
        emptyActivity

      const matchesSearch =
        !normalizedSearch ||
        [
          land.landName,
          land.location,
          land.landCode,
          land.soilType,
          ...activity.farmerNames,
          ...activity.cropNames,
        ].some((value) =>
          value
            .toLowerCase()
            .includes(normalizedSearch),
        )

      const matchesOwnership =
        ownershipFilter === 'all' ||
        land.ownership ===
          ownershipFilter

      const matchesStatus =
        statusFilter === 'all' ||
        land.status === statusFilter

      return (
        matchesSearch &&
        matchesOwnership &&
        matchesStatus
      )
    })
  }, [
    activityByLand,
    lands,
    ownershipFilter,
    searchTerm,
    statusFilter,
  ])

  const landSummary = [
    {
      title: 'Total Active Land',
      value: formatAcres(
        currentTotals.totalLandAcres,
      ),
      description:
        'Owned and leased active land',
      icon: MapIcon,
      style:
        'bg-sky-100 text-sky-700',
    },
    {
      title: 'Assigned Land',
      value: formatAcres(
        currentTotals.assignedAcres,
      ),
      description:
        'Currently assigned to farmers',
      icon: Building2,
      style:
        'bg-indigo-100 text-indigo-700',
    },
    {
      title: 'Current Crop Acres',
      value: formatAcres(
        currentTotals.cropAcres,
      ),
      description:
        'Planned and active crops',
      icon: Sprout,
      style:
        'bg-amber-100 text-amber-700',
    },
    {
      title: 'Unassigned Land',
      value: formatAcres(
        currentTotals.unassignedAcres,
      ),
      description:
        'Not assigned to any farmer',
      icon: MapIcon,
      style:
        'bg-emerald-100 text-emerald-700',
    },
  ]

  const openAddForm = () => {
    setEditingLand(null)
    setIsFormOpen(true)
  }

  const openEditForm = (land: Land) => {
    setEditingLand(land)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingLand(null)
  }

  const handleFormSubmit = async (
    input: CreateLandInput,
  ) => {
    const inputWithWorkspace: CreateLandInput =
      {
        ...input,
        organizationId,
      }

    if (editingLand) {
      await updateLand(
        editingLand.id,
        inputWithWorkspace,
      )
    } else {
      await createLand(
        inputWithWorkspace,
      )
    }

    await loadPageData()
  }

  const handleArchive = async (
    land: Land,
  ) => {
    const activity =
      activityByLand.get(land.id) ??
      emptyActivity

    if (
      activity.assignmentCount > 0 ||
      activity.cropCount > 0
    ) {
      setPageError(
        `${land.landName} cannot be archived while active land assignments or crops remain.`,
      )
      return
    }

    const confirmed = window.confirm(
      `Archive "${land.landName}"?`,
    )

    if (!confirmed) {
      return
    }

    try {
      setPageError('')
      await archiveLand(land.id)
      await loadPageData()
    } catch (error) {
      console.error(
        'Unable to archive land:',
        error,
      )
      setPageError(
        'Unable to archive the land record.',
      )
    }
  }

  const handleRestore = async (
    land: Land,
  ) => {
    try {
      setPageError('')
      await restoreLand(land.id)
      await loadPageData()
    } catch (error) {
      console.error(
        'Unable to restore land:',
        error,
      )
      setPageError(
        'Unable to restore the land record.',
      )
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
              Lands
            </h1>

            <p className="mt-2 text-slate-500">
              View current land assignments,
              crops and available acreage.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            <Plus className="h-5 w-5" />
            Add Land
          </button>
        </section>

        {pageError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {pageError}
          </div>
        )}

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {landSummary.map((item) => {
            const Icon = item.icon

            return (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div
                  className={`grid h-11 w-11 place-items-center rounded-xl ${item.style}`}
                >
                  <Icon className="h-5 w-5" />
                </div>

                <p className="mt-5 text-sm font-medium text-slate-500">
                  {item.title}
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {item.value}
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {item.description}
                </p>
              </article>
            )
          })}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Current Land Records
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {filteredLands.length}{' '}
                  displayed record
                  {filteredLands.length === 1
                    ? ''
                    : 's'}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5 sm:w-72">
                  <Search className="h-5 w-5 text-slate-400" />

                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(
                        event.target.value,
                      )
                    }
                    placeholder="Search lands, farmers or crops..."
                    className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </div>

                <select
                  value={ownershipFilter}
                  onChange={(event) =>
                    setOwnershipFilter(
                      event.target
                        .value as OwnershipFilter,
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="all">
                    All Ownership
                  </option>
                  <option value="owned">
                    Owned
                  </option>
                  <option value="leased">
                    Leased
                  </option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target
                        .value as StatusFilter,
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="active">
                    Active
                  </option>
                  <option value="archived">
                    Archived
                  </option>
                  <option value="all">
                    All Statuses
                  </option>
                </select>
              </div>
            </div>
          </header>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    'Land',
                    'Ownership',
                    'Total Area',
                    'Active Assignments',
                    'Current Crops',
                    'Current Allocation',
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
                      colSpan={8}
                      className="px-5 py-16 text-center"
                    >
                      <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-emerald-700" />
                      <p className="mt-3 text-sm text-slate-500">
                        Loading current land
                        activity...
                      </p>
                    </td>
                  </tr>
                ) : filteredLands.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-16 text-center"
                    >
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                        <MapIcon className="h-7 w-7" />
                      </div>

                      <h3 className="mt-4 font-bold text-slate-900">
                        {lands.length === 0
                          ? 'No land records yet'
                          : 'No matching lands found'}
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        {lands.length === 0
                          ? 'Use Add Land whenever you are ready.'
                          : 'Try changing the search or filters.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLands.map(
                    (land) => {
                      const activity =
                        activityByLand.get(
                          land.id,
                        ) ?? emptyActivity

                      const landLabel =
                        land.landName ||
                        land.location ||
                        land.landCode

                      return (
                        <tr
                          key={land.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900">
                              {landLabel}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-emerald-700">
                              {land.landCode}
                            </p>
                            <p className="mt-1 max-w-44 truncate text-xs text-slate-400">
                              {land.location ||
                                'No location'}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <span
                              className={[
                                'inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize',
                                land.ownership ===
                                'owned'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-violet-100 text-violet-700',
                              ].join(' ')}
                            >
                              {land.ownership}
                            </span>

                            {land.ownership ===
                              'leased' && (
                              <p className="mt-2 text-xs text-slate-500">
                                {formatCurrency(
                                  land.annualLeaseAmount,
                                )}{' '}
                                yearly
                              </p>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                            {formatAcres(
                              land.totalAcres,
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {activity.assignmentCount >
                            0 ? (
                              <>
                                <p className="font-bold text-slate-900">
                                  {formatAcres(
                                    activity.assignedAcres,
                                  )}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {
                                    activity.assignmentCount
                                  }{' '}
                                  active assignment
                                  {activity.assignmentCount ===
                                  1
                                    ? ''
                                    : 's'}
                                </p>
                                <div className="mt-2 flex max-w-52 flex-wrap gap-1">
                                  {activity.farmerNames.map(
                                    (name) => (
                                      <span
                                        key={name}
                                        className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700"
                                      >
                                        {name}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </>
                            ) : (
                              <span className="text-sm text-slate-400">
                                No active assignment
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {activity.cropCount >
                            0 ? (
                              <>
                                <p className="font-bold text-amber-700">
                                  {formatAcres(
                                    activity.cropAcres,
                                  )}
                                </p>
                                <div className="mt-2 flex max-w-52 flex-wrap gap-1">
                                  {activity.cropNames.map(
                                    (name) => (
                                      <span
                                        key={name}
                                        className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                      >
                                        {name}
                                      </span>
                                    ),
                                  )}
                                </div>
                              </>
                            ) : (
                              <span className="text-sm text-slate-400">
                                No current crop
                              </span>
                            )}
                          </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm">
  {activity.assignmentCount > 0 ? (
    <p className="font-semibold text-emerald-700">
      {formatAcres(
        activity.assignedBalanceAcres,
      )}{' '}
      not yet planted
    </p>
  ) : (
    <p className="font-semibold text-slate-500">
      Not yet assigned
    </p>
  )}

  <p className="mt-2 text-slate-500">
    {formatAcres(
      activity.unassignedAcres,
    )}{' '}
    unassigned
  </p>
</td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <span
                              className={[
                                'inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize',
                                land.status ===
                                'active'
                                  ? 'bg-sky-100 text-sky-700'
                                  : 'bg-slate-200 text-slate-600',
                              ].join(' ')}
                            >
                              {land.status}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                aria-label={`Edit ${landLabel}`}
                                onClick={() =>
                                  openEditForm(
                                    land,
                                  )
                                }
                                className="rounded-lg p-2 text-sky-700 transition hover:bg-sky-50"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              {land.status ===
                              'active' ? (
                                <button
                                  type="button"
                                  aria-label={`Archive ${landLabel}`}
                                  onClick={() =>
                                    void handleArchive(
                                      land,
                                    )
                                  }
                                  className="rounded-lg p-2 text-amber-700 transition hover:bg-amber-50"
                                >
                                  <Archive className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  aria-label={`Restore ${landLabel}`}
                                  onClick={() =>
                                    void handleRestore(
                                      land,
                                    )
                                  }
                                  className="rounded-lg p-2 text-emerald-700 transition hover:bg-emerald-50"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </button>
                              )}
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

      <LandFormModal
        isOpen={isFormOpen}
        land={editingLand}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
      />
    </>
  )
}

export default LandsPage