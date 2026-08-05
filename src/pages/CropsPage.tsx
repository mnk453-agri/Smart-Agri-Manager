import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Sprout,
  Trash2,
} from 'lucide-react'
import CropFormModal from '../components/CropFormModal'
import { useAuth } from '../contexts/AuthContext'
import {
  calculateCropSummary,
  createCrop,
  deleteCrop,
  getCrops,
  updateCrop,
} from '../services/cropService'
import { getFarmers } from '../services/farmerService'
import { getLandAssignments } from '../services/landAssignmentService'
import { getLands } from '../services/landService'
import type {
  CreateCropInput,
  Crop,
  CropStatus,
} from '../types/crop'
import type { Farmer } from '../types/farmer'
import type { Land } from '../types/land'
import type { LandAssignment } from '../types/landAssignment'

const formatAcres = (value: number) =>
  `${value.toLocaleString()} Acres`

const formatDate = (value: string) => {
  if (!value) {
    return '—'
  }

  return new Intl.DateTimeFormat(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(
    new Date(`${value}T00:00:00`),
  )
}

const formatStatus = (
  status: CropStatus,
) =>
  status.charAt(0).toUpperCase() +
  status.slice(1)

const getStatusClasses = (
  status: CropStatus,
) => {
  if (status === 'active') {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (status === 'planned') {
    return 'bg-sky-100 text-sky-700'
  }

  if (status === 'harvested') {
    return 'bg-amber-100 text-amber-700'
  }

  return 'bg-slate-200 text-slate-700'
}

function CropsPage() {
  const { activeWorkspace } = useAuth()

  const [crops, setCrops] = useState<
    Crop[]
  >([])
  const [assignments, setAssignments] =
    useState<LandAssignment[]>([])
  const [lands, setLands] = useState<
    Land[]
  >([])
  const [farmers, setFarmers] = useState<
    Farmer[]
  >([])
  const [searchTerm, setSearchTerm] =
    useState('')
  const [isLoading, setIsLoading] =
    useState(true)
  const [pageError, setPageError] =
    useState('')
  const [isFormOpen, setIsFormOpen] =
    useState(false)
  const [editingCrop, setEditingCrop] =
    useState<Crop | null>(null)
  const [
    deletingCropId,
    setDeletingCropId,
  ] = useState<string | null>(null)

  const organizationId =
    activeWorkspace?.organization.id ?? ''

  const loadPageData = async () => {
    try {
      setIsLoading(true)
      setPageError('')

      const [
        cropRecords,
        assignmentRecords,
        landRecords,
        farmerRecords,
      ] = await Promise.all([
        organizationId
          ? getCrops(organizationId)
          : getCrops(),
        organizationId
          ? getLandAssignments(
              organizationId,
            )
          : getLandAssignments(),
        organizationId
          ? getLands(organizationId)
          : getLands(),
        organizationId
          ? getFarmers(organizationId)
          : getFarmers(),
      ])

      setCrops(cropRecords)
      setAssignments(assignmentRecords)
      setLands(landRecords)
      setFarmers(farmerRecords)
    } catch (error) {
      console.error(
        'Unable to load crop data:',
        error,
      )
      setPageError(
        'Unable to load crops. Please check Firestore and try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPageData()
  }, [organizationId])

  const summary = useMemo(
    () => calculateCropSummary(crops),
    [crops],
  )

  const landById = useMemo(
    () =>
      new Map(
        lands.map((land) => [
          land.id,
          land,
        ]),
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

  const assignmentById = useMemo(
    () =>
      new Map(
        assignments.map(
          (assignment) => [
            assignment.id,
            assignment,
          ],
        ),
      ),
    [assignments],
  )

  const filteredCrops = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return crops
    }

    return crops.filter((crop) => {
      const land =
        landById.get(crop.landId)
      const farmer =
        farmerById.get(crop.farmerId)

      return [
        crop.cropCode,
        crop.cropName,
        crop.season,
        crop.status,
        land?.landCode ?? '',
        land?.landName ?? '',
        farmer?.farmerCode ?? '',
        farmer?.farmerName ?? '',
      ].some((value) =>
        value
          .toLowerCase()
          .includes(normalizedSearch),
      )
    })
  }, [
    crops,
    farmerById,
    landById,
    searchTerm,
  ])

  const openAddForm = () => {
    setEditingCrop(null)
    setIsFormOpen(true)
  }

  const openEditForm = (crop: Crop) => {
    setEditingCrop(crop)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingCrop(null)
  }

  const handleSubmit = async (
    input: CreateCropInput,
  ) => {
    const inputWithWorkspace = {
      ...input,
      organizationId,
    }

    if (editingCrop) {
      await updateCrop(
        editingCrop.id,
        inputWithWorkspace,
      )
    } else {
      await createCrop(inputWithWorkspace)
    }

    await loadPageData()
  }

  const handleDelete = async (
    crop: Crop,
  ) => {
    if (deletingCropId) {
      return
    }

    const confirmed = window.confirm(
      `Permanently delete ${crop.cropCode} — ${crop.cropName}?\n\nOnly continue if no expense, sale, advance, harvest, or settlement is linked to this crop.`,
    )

    if (!confirmed) {
      return
    }

    setDeletingCropId(crop.id)
    setPageError('')

    try {
      await deleteCrop(crop.id)
      await loadPageData()
    } catch (error) {
      console.error(
        'Unable to delete crop:',
        error,
      )
      setPageError(
        'Unable to delete the crop. Please try again.',
      )
    } finally {
      setDeletingCropId(null)
    }
  }
  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="h-6 w-6 animate-spin text-emerald-700" />
          Loading crops...
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              Crop Management
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Crops
            </h1>

            <p className="mt-2 text-slate-500">
              Plan crop cycles, allocate assigned acreage, and define owner-farmer sharing.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            <Plus className="h-5 w-5" />
            Start Crop
          </button>
        </section>

        {pageError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {pageError}
          </div>
        )}

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Sprout className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Total Crops
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {summary.totalCrops}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
              <Sprout className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Planned
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {summary.plannedCrops}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Sprout className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Active
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {summary.activeCrops}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Sprout className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Harvested
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {summary.harvestedCrops}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Sprout className="h-5 w-5" />
            </div>
            <p className="mt-5 text-sm text-slate-500">
              Crop Acreage
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {formatAcres(
                summary.totalCropAcres,
              )}
            </p>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Crop Records
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredCrops.length}{' '}
                displayed crop
                {filteredCrops.length === 1
                  ? ''
                  : 's'}
              </p>
            </div>

            <label className="relative block w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value,
                  )
                }
                placeholder="Search crops..."
                className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-4 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </header>

          {filteredCrops.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Sprout className="h-7 w-7" />
              </div>

              <h3 className="mt-4 text-lg font-bold text-slate-900">
                {crops.length === 0
                  ? 'No crops yet'
                  : 'No matching crops'}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {crops.length === 0
                  ? 'Start the first crop cycle from an active land assignment.'
                  : 'Try a different crop, land, farmer, code, season, or status.'}
              </p>

              {crops.length === 0 && (
                <button
                  type="button"
                  onClick={openAddForm}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
                >
                  <Plus className="h-5 w-5" />
                  Start Crop
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">
                      Crop
                    </th>
                    <th className="px-5 py-4">
  Land
</th>
<th className="px-5 py-4">
  Farmer
</th>
                    <th className="px-5 py-4">
                      Area
                    </th>
                    <th className="px-5 py-4">
                      Sharing
                    </th>
                    <th className="px-5 py-4">
                      Season
                    </th>
                    <th className="px-5 py-4">
                      Dates
                    </th>
                    <th className="px-5 py-4">
                      Status
                    </th>
                    <th className="px-5 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCrops.map(
                    (crop) => {
                      const land =
                        landById.get(
                          crop.landId,
                        )
                      const farmer =
                        farmerById.get(
                          crop.farmerId,
                        )
                      const assignment =
                        assignmentById.get(
                          crop.landAssignmentId,
                        )

                      return (
                        <tr
                          key={crop.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900">
                              {crop.cropName}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-emerald-700">
                              {crop.cropCode}
                            </p>
                          </td>

                         <td className="px-5 py-4">
  <p className="font-semibold text-slate-900">
    {land?.landName ??
      'Unknown Land'}
  </p>
  <p className="mt-1 text-xs font-semibold text-emerald-700">
    {land?.landCode ??
      'LAND-000'}
  </p>
  {assignment && (
    <p className="mt-1 text-xs text-slate-400">
      Assigned:{' '}
      {formatAcres(
        assignment.assignedAcres,
      )}
    </p>
  )}
</td>

<td className="px-5 py-4">
  <p className="font-semibold text-slate-900">
    {farmer?.farmerName ??
      'Unknown Farmer'}
  </p>
  <p className="mt-1 text-xs font-semibold text-sky-700">
    {farmer?.farmerCode ??
      'FARMER-000'}
  </p>
</td>

                          <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                            {formatAcres(
                              crop.areaAcres,
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            {crop.cropShareType ===
                            'owner_only' ? (
                              <span className="font-semibold text-slate-700">
                                Owner Only
                              </span>
                            ) : (
                              <div>
                                <p className="font-semibold text-slate-700">
                                  Shared
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Owner{' '}
                                  {
                                    crop.ownerSharePercentage
                                  }
                                  % / Farmer{' '}
                                  {
                                    crop.farmerSharePercentage
                                  }
                                  %
                                </p>
                              </div>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 capitalize text-slate-700">
                            {crop.season}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <p className="text-sm font-medium text-slate-700">
                              {formatDate(
                                crop.sowingDate,
                              )}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              Expected:{' '}
                              {formatDate(
                                crop.expectedHarvestDate,
                              )}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                crop.status,
                              )}`}
                            >
                              {formatStatus(
                                crop.status,
                              )}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                aria-label="Edit crop"
                                onClick={() =>
                                  openEditForm(
                                    crop,
                                  )
                                }
                                disabled={Boolean(
                                  deletingCropId,
                                )}
                                className="rounded-lg p-2 text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>

                              <button
                                type="button"
                                aria-label="Delete crop"
                                onClick={() =>
                                  void handleDelete(
                                    crop,
                                  )
                                }
                                disabled={Boolean(
                                  deletingCropId,
                                )}
                                className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {deletingCropId ===
                                crop.id ? (
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
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <CropFormModal
        isOpen={isFormOpen}
        crop={editingCrop}
        organizationId={organizationId}
        assignments={assignments}
        lands={lands}
        farmers={farmers}
        existingCrops={crops}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />
    </>
  )
}

export default CropsPage