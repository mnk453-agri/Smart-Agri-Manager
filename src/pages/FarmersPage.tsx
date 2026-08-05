import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import { Link } from 'react-router'
import {
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react'
import FarmerFormModal from '../components/FarmerFormModal'
import { useAuth } from '../contexts/AuthContext'
import { getCrops } from '../services/cropService'
import {
  archiveFarmer,
  createFarmer,
  getFarmers,
  restoreFarmer,
  updateFarmer,
} from '../services/farmerService'
import { getLandAssignments } from '../services/landAssignmentService'
import type {
  CreateFarmerInput,
  Farmer,
} from '../types/farmer'
import type { Crop } from '../types/crop'
import type { LandAssignment } from '../types/landAssignment'

type FarmerActivity = {
  assignmentCount: number
  assignedAcres: number
  currentCropCount: number
  cropAcres: number
  balanceAcres: number
  cropNames: string[]
}

const emptyActivity: FarmerActivity = {
  assignmentCount: 0,
  assignedAcres: 0,
  currentCropCount: 0,
  cropAcres: 0,
  balanceAcres: 0,
  cropNames: [],
}

const formatAcres = (value: number) =>
  `${value.toLocaleString()} Acres`

function FarmersPage() {
  const { activeWorkspace } = useAuth()

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
  const [showArchived, setShowArchived] =
    useState(false)
  const [isFormOpen, setIsFormOpen] =
    useState(false)
  const [
    editingFarmer,
    setEditingFarmer,
  ] = useState<Farmer | null>(null)
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
        farmerRecords,
        assignmentRecords,
        cropRecords,
      ] = await Promise.all([
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

      setFarmers(farmerRecords)
      setAssignments(assignmentRecords)
      setCrops(cropRecords)
    } catch (error) {
      console.error(
        'Unable to load farmer activity:',
        error,
      )
      setPageError(
        'Unable to load farmer records and activity.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPageData()
  }, [organizationId])

  const activityByFarmer = useMemo(() => {
    const activityMap = new Map<
      string,
      {
        assignmentCount: number
        assignedAcres: number
        cropAcres: number
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
            assignment.farmerId,
          ) ?? {
            assignmentCount: 0,
            assignedAcres: 0,
            cropAcres: 0,
            cropNames: new Set<string>(),
          }

        current.assignmentCount += 1
        current.assignedAcres +=
          assignment.assignedAcres

        activityMap.set(
          assignment.farmerId,
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
          activityMap.get(crop.farmerId) ?? {
            assignmentCount: 0,
            assignedAcres: 0,
            cropAcres: 0,
            cropNames: new Set<string>(),
          }

        current.cropAcres +=
          crop.areaAcres
        current.cropNames.add(
          crop.cropName,
        )

        activityMap.set(
          crop.farmerId,
          current,
        )
      })

    return new Map<
      string,
      FarmerActivity
    >(
      Array.from(
        activityMap.entries(),
      ).map(([farmerId, activity]) => [
        farmerId,
        {
          assignmentCount:
            activity.assignmentCount,
          assignedAcres:
            activity.assignedAcres,
          currentCropCount:
            activity.cropNames.size,
          cropAcres:
            activity.cropAcres,
          balanceAcres: Math.max(
            activity.assignedAcres -
              activity.cropAcres,
            0,
          ),
          cropNames: Array.from(
            activity.cropNames,
          ).sort(),
        },
      ]),
    )
  }, [assignments, crops])

  const displayedFarmers = useMemo(
    () =>
      farmers.filter((farmer) =>
        showArchived
          ? farmer.status === 'archived'
          : farmer.status === 'active',
      ),
    [farmers, showArchived],
  )

  const filteredFarmers = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return displayedFarmers
    }

    return displayedFarmers.filter(
      (farmer) => {
        const activity =
          activityByFarmer.get(
            farmer.id,
          ) ?? emptyActivity

        return [
          farmer.farmerCode,
          farmer.farmerName,
          farmer.casteName,
          farmer.phoneNumber,
          farmer.status,
          ...activity.cropNames,
        ].some((value) =>
          value
            .toLowerCase()
            .includes(normalizedSearch),
        )
      },
    )
  }, [
    activityByFarmer,
    displayedFarmers,
    searchTerm,
  ])

  const activeFarmers = farmers.filter(
    (farmer) =>
      farmer.status === 'active',
  ).length

  const archivedFarmers =
    farmers.length - activeFarmers

  const totalAssignedAcres = Array.from(
    activityByFarmer.values(),
  ).reduce(
    (total, activity) =>
      total + activity.assignedAcres,
    0,
  )

  const totalCropAcres = Array.from(
    activityByFarmer.values(),
  ).reduce(
    (total, activity) =>
      total + activity.cropAcres,
    0,
  )

  const openAddForm = () => {
    setEditingFarmer(null)
    setIsFormOpen(true)
  }

  const openEditForm = (
    farmer: Farmer,
  ) => {
    setEditingFarmer(farmer)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingFarmer(null)
  }

  const handleSubmit = async (
    input: CreateFarmerInput,
  ) => {
    const inputWithWorkspace = {
      ...input,
      organizationId,
    }

    if (editingFarmer) {
      await updateFarmer(
        editingFarmer.id,
        inputWithWorkspace,
      )
    } else {
      await createFarmer(
        inputWithWorkspace,
      )
    }

    await loadPageData()
  }

  const handleArchive = async (
    farmer: Farmer,
  ) => {
    const activity =
      activityByFarmer.get(farmer.id) ??
      emptyActivity

    if (
      activity.assignmentCount > 0 ||
      activity.currentCropCount > 0
    ) {
      setPageError(
        `${farmer.farmerName} cannot be archived while active land assignments or crops remain.`,
      )
      return
    }

    const confirmed = window.confirm(
      `Archive ${farmer.farmerName}?`,
    )

    if (!confirmed) {
      return
    }

    try {
      setPageError('')
      await archiveFarmer(farmer.id)
      await loadPageData()
    } catch (error) {
      console.error(
        'Unable to archive farmer:',
        error,
      )
      setPageError(
        'Unable to archive the farmer.',
      )
    }
  }

  const handleRestore = async (
    farmer: Farmer,
  ) => {
    try {
      setPageError('')
      await restoreFarmer(farmer.id)
      await loadPageData()
    } catch (error) {
      console.error(
        'Unable to restore farmer:',
        error,
      )
      setPageError(
        'Unable to restore the farmer.',
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
              Farmers
            </h1>

            <p className="mt-2 text-slate-500">
              Monitor farmer records, assigned acreage, current crops, and available balances.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            <Plus className="h-5 w-5" />
            Add Farmer
          </button>
        </section>

        {pageError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {pageError}
          </div>
        )}

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-100 text-sky-700">
              <Users className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Total Farmers
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {farmers.length}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <UserCheck className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Active Farmers
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {activeFarmers}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <UserX className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Archived Farmers
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {archivedFarmers}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-100 text-violet-700">
              <Users className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Assigned Acreage
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatAcres(
                totalAssignedAcres,
              )}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <UserCheck className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Current Crop Acreage
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {formatAcres(
                totalCropAcres,
              )}
            </p>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Farmer Records
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredFarmers.length}{' '}
                displayed farmer
                {filteredFarmers.length === 1
                  ? ''
                  : 's'}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <button
                type="button"
                onClick={() =>
                  setShowArchived(
                    (current) => !current,
                  )
                }
                className="whitespace-nowrap rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {showArchived
                  ? 'Show Active Farmers'
                  : 'Show Archived Farmers'}
              </button>

              <label className="relative block w-full sm:w-80">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value,
                    )
                  }
                  placeholder="Search farmers or crops..."
                  className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-4 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
            </div>
          </header>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-4">
                    Farmer
                  </th>
                  <th className="px-5 py-4">
                    Community
                  </th>
                  <th className="px-5 py-4">
                    Phone
                  </th>
                  <th className="px-5 py-4">
                    Land Assignments
                  </th>
                  <th className="px-5 py-4">
                    Current Crops
                  </th>
                  <th className="px-5 py-4">
                    Crop Acres
                  </th>
                  <th className="px-5 py-4">
                    Balance
                  </th>
                  <th className="px-5 py-4">
                    Status
                  </th>
                  <th className="px-5 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-16 text-center"
                    >
                      <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-emerald-700" />
                      <p className="mt-3 text-sm text-slate-500">
                        Loading farmer activity...
                      </p>
                    </td>
                  </tr>
                ) : filteredFarmers.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-16 text-center"
                    >
                      <Users className="mx-auto h-10 w-10 text-sky-600" />
                      <h3 className="mt-4 font-bold text-slate-900">
                        {displayedFarmers.length ===
                        0
                          ? showArchived
                            ? 'No archived farmers'
                            : 'No active farmers'
                          : 'No matching farmers found'}
                      </h3>
                    </td>
                  </tr>
                ) : (
                  filteredFarmers.map(
                    (farmer) => {
                      const activity =
                        activityByFarmer.get(
                          farmer.id,
                        ) ?? emptyActivity

                      return (
                        <tr
                          key={farmer.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <Link
  to={`/farmers/${farmer.id}`}
  className="font-bold text-slate-900 transition hover:text-emerald-700 hover:underline"
>
  {farmer.farmerName}
</Link>
                            <p className="mt-1 text-xs font-semibold text-sky-700">
                              {farmer.farmerCode}
                            </p>
                            {farmer.notes && (
                              <p className="mt-1 max-w-48 truncate text-xs text-slate-400">
                                {farmer.notes}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {farmer.casteName ||
                              '—'}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                            {farmer.phoneNumber ||
                              '—'}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
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
                          </td>

                          <td className="px-5 py-4">
                            {activity.cropNames.length >
                            0 ? (
                              <div className="flex max-w-56 flex-wrap gap-1.5">
                                {activity.cropNames.map(
                                  (cropName) => (
                                    <span
                                      key={
                                        cropName
                                      }
                                      className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                                    >
                                      {cropName}
                                    </span>
                                  ),
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">
                                No current crop
                              </span>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <p className="font-bold text-amber-700">
                              {formatAcres(
                                activity.cropAcres,
                              )}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {
                                activity.currentCropCount
                              }{' '}
                              current crop
                              {activity.currentCropCount ===
                              1
                                ? ''
                                : 's'}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <p className="font-bold text-emerald-700">
                              {formatAcres(
                                activity.balanceAcres,
                              )}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Unallocated
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={
                                farmer.status ===
                                'active'
                                  ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold capitalize text-emerald-700'
                                  : 'rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold capitalize text-slate-600'
                              }
                            >
                              {farmer.status}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                aria-label={`Edit ${farmer.farmerName}`}
                                onClick={() =>
                                  openEditForm(
                                    farmer,
                                  )
                                }
                                className="rounded-lg p-2 text-sky-700 transition hover:bg-sky-50"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              {farmer.status ===
                              'active' ? (
                                <button
                                  type="button"
                                  aria-label={`Archive ${farmer.farmerName}`}
                                  onClick={() =>
                                    void handleArchive(
                                      farmer,
                                    )
                                  }
                                  className="rounded-lg p-2 text-amber-700 transition hover:bg-amber-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  aria-label={`Restore ${farmer.farmerName}`}
                                  onClick={() =>
                                    void handleRestore(
                                      farmer,
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

      <FarmerFormModal
        isOpen={isFormOpen}
        farmer={editingFarmer}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />
    </>
  )
}

export default FarmersPage