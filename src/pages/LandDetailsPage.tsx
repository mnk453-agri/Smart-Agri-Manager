import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  ArrowLeft,
  Building2,
  LandPlot,
  LoaderCircle,
  MapPin,
  Sprout,
  Wheat,
} from 'lucide-react'
import {
  Link,
  useParams,
} from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { getCrops } from '../services/cropService'
import { getFarmers } from '../services/farmerService'
import { getLandAssignments } from '../services/landAssignmentService'
import { getLands } from '../services/landService'
import type { Crop } from '../types/crop'
import type { Farmer } from '../types/farmer'
import type { Land } from '../types/land'
import type { LandAssignment } from '../types/landAssignment'

type ActiveAssignmentDetails = {
  assignment: LandAssignment
  farmer: Farmer | null
  crops: Crop[]
  cropAcres: number
  notYetPlantedAcres: number
}

const formatAcres = (value: number) =>
  `${value.toLocaleString()} Acres`

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value)

const formatStatus = (value: string) =>
  value
    .split('_')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(' ')

const formatShare = (crop: Crop) => {
  if (
    crop.cropShareType === 'owner_only'
  ) {
    return 'Owner Only'
  }

  return `Owner ${crop.ownerSharePercentage}% / Farmer ${crop.farmerSharePercentage}%`
}

function LandDetailsPage() {
  const { landId = '' } = useParams<{
    landId: string
  }>()
  const { activeWorkspace } = useAuth()

  const [land, setLand] =
    useState<Land | null>(null)
  const [farmers, setFarmers] =
    useState<Farmer[]>([])
  const [assignments, setAssignments] =
    useState<LandAssignment[]>([])
  const [crops, setCrops] =
    useState<Crop[]>([])
  const [isLoading, setIsLoading] =
    useState(true)
  const [pageError, setPageError] =
    useState('')

  const organizationId =
    activeWorkspace?.organization.id ?? ''

  useEffect(() => {
    let isCurrent = true

    const loadLandDetails = async () => {
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

        if (!isCurrent) {
          return
        }

        const selectedLand =
          landRecords.find(
            (record) =>
              record.id === landId,
          ) ?? null

        setLand(selectedLand)
        setFarmers(farmerRecords)
        setAssignments(
          assignmentRecords,
        )
        setCrops(cropRecords)

        if (!selectedLand) {
          setPageError(
            'The selected land could not be found.',
          )
        }
      } catch (error) {
        console.error(
          'Unable to load current land details:',
          error,
        )

        if (isCurrent) {
          setPageError(
            'Unable to load current land activity. Please try again.',
          )
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false)
        }
      }
    }

    void loadLandDetails()

    return () => {
      isCurrent = false
    }
  }, [landId, organizationId])

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

  const activeLandAssignments =
    useMemo(
      () =>
        assignments.filter(
          (assignment) =>
            assignment.landId ===
              landId &&
            assignment.status === 'active',
        ),
      [assignments, landId],
    )

  const currentLandCrops = useMemo(
    () =>
      crops.filter(
        (crop) =>
          crop.landId === landId &&
          (crop.status === 'planned' ||
            crop.status === 'active'),
      ),
    [crops, landId],
  )

  const activeAssignmentDetails =
    useMemo<ActiveAssignmentDetails[]>(
      () =>
        activeLandAssignments.map(
          (assignment) => {
            const assignmentCrops =
              currentLandCrops.filter(
                (crop) =>
                  crop.landAssignmentId ===
                  assignment.id,
              )

            const cropAcres =
              assignmentCrops.reduce(
                (total, crop) =>
                  total + crop.areaAcres,
                0,
              )

            return {
              assignment,
              farmer:
                farmerById.get(
                  assignment.farmerId,
                ) ?? null,
              crops: assignmentCrops,
              cropAcres,
              notYetPlantedAcres:
                Math.max(
                  assignment.assignedAcres -
                    cropAcres,
                  0,
                ),
            }
          },
        ),
      [
        activeLandAssignments,
        currentLandCrops,
        farmerById,
      ],
    )

  const activityTotals = useMemo(
    () =>
      activeAssignmentDetails.reduce(
        (totals, details) => ({
          assignedAcres:
            totals.assignedAcres +
            details.assignment.assignedAcres,
          cropAcres:
            totals.cropAcres +
            details.cropAcres,
          notYetPlantedAcres:
            totals.notYetPlantedAcres +
            details.notYetPlantedAcres,
          assignmentCount:
            totals.assignmentCount + 1,
          cropCount:
            totals.cropCount +
            details.crops.length,
        }),
        {
          assignedAcres: 0,
          cropAcres: 0,
          notYetPlantedAcres: 0,
          assignmentCount: 0,
          cropCount: 0,
        },
      ),
    [activeAssignmentDetails],
  )

  const unassignedAcres = Math.max(
    (land?.totalAcres ?? 0) -
      activityTotals.assignedAcres,
    0,
    )

  if (isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <LoaderCircle className="h-6 w-6 animate-spin" />
          <span>
            Loading current land activity...
          </span>
        </div>
      </div>
    )
  }

  if (pageError || !land) {
    return (
      <div className="space-y-6">
        <Link
          to="/lands"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lands
        </Link>

        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <h1 className="text-xl font-bold text-rose-900">
            Land details unavailable
          </h1>
          <p className="mt-2 text-rose-700">
            {pageError ||
              'The selected land could not be found.'}
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/lands"
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Lands
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <LandPlot className="h-6 w-6" />
            </div>

            <div>
              <p className="text-sm font-semibold text-emerald-700">
                Current Land Activity
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                {land.landName}
              </h1>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                <span className="font-semibold text-slate-700">
                  {land.ownership ===
                  'leased'
                    ? 'Leased'
                    : 'Owned'}
                </span>

                {land.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {land.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
          Active Land
        </span>
      </section>

      {land.ownership === 'leased' && (
        <section className="flex flex-col gap-2 rounded-xl border border-violet-200 bg-violet-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-violet-900">
              Leased Land
            </p>
            <p className="mt-1 text-sm text-violet-700">
              Annual lease is recorded separately
              from crop sharing.
            </p>
          </div>

          <p className="font-bold text-violet-900">
            {formatCurrency(
              land.annualLeaseAmount,
            )}{' '}
            yearly
          </p>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <LandPlot className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Total Land
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatAcres(
              land.totalAcres,
            )}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <Building2 className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Assigned Land
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatAcres(
              activityTotals.assignedAcres,
            )}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <Wheat className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Crop Acres
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-700">
            {formatAcres(
              activityTotals.cropAcres,
            )}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <Sprout className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Not Yet Planted
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">
            {formatAcres(
              activityTotals.notYetPlantedAcres,
            )}
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <LandPlot className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">
            Unassigned Land
          </p>
          <p className="mt-1 text-2xl font-bold text-violet-700">
            {formatAcres(
              unassignedAcres,
            )}
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-bold text-slate-900">
            Active Farmer Assignments
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Only active assignments and planned or
            active crops are shown.
          </p>
        </header>

        {activeAssignmentDetails.length ===
        0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <LandPlot className="h-8 w-8" />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Not yet assigned
            </h3>

            <p className="mt-2 max-w-md text-slate-500">
              {formatAcres(
                land.totalAcres,
              )}{' '}
              are currently unassigned.
            </p>
          </div>
        ) : (
          <div className="space-y-5 bg-slate-50 p-5">
            {activeAssignmentDetails.map(
              (details) => (
                <article
                  key={details.assignment.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <header className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-900">
                          {details.farmer
                            ?.farmerName ||
                            'Unknown Farmer'}
                        </h3>

                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Active Assignment
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-500">
                        Caste / Community:{' '}
                        <span className="font-semibold text-slate-700">
                          {details.farmer
                            ?.casteName ||
                            '—'}
                        </span>
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-5 text-left lg:text-right">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Assigned
                        </p>
                        <p className="mt-1 font-bold text-slate-900">
                          {formatAcres(
                            details.assignment
                              .assignedAcres,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Crop
                        </p>
                        <p className="mt-1 font-bold text-amber-700">
                          {formatAcres(
                            details.cropAcres,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Not Planted
                        </p>
                        <p className="mt-1 font-bold text-emerald-700">
                          {formatAcres(
                            details.notYetPlantedAcres,
                          )}
                        </p>
                      </div>
                    </div>
                  </header>

                  {details.crops.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                      <p className="font-semibold text-slate-700">
                        No current crop for this
                        assignment
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {formatAcres(
                          details.notYetPlantedAcres,
                        )}{' '}
                        have not yet been planted.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-5 py-3">
                              Crop
                            </th>
                            <th className="px-5 py-3">
                              Area
                            </th>
                            <th className="px-5 py-3">
                              Season
                            </th>
                            <th className="px-5 py-3">
                              Sharing
                            </th>
                            <th className="px-5 py-3">
                              Status
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {details.crops.map(
                            (crop) => (
                              <tr
                                key={crop.id}
                                className="text-sm"
                              >
                                <td className="whitespace-nowrap px-5 py-4">
                                  <p className="font-bold text-slate-900">
                                    {crop.cropName}
                                  </p>

                                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                                    {crop.cropCode}
                                  </p>
                                </td>

                                <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                                  {formatAcres(
                                    crop.areaAcres,
                                  )}
                                </td>

                                <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                                  {formatStatus(
                                    crop.season,
                                  )}
                                </td>

                                <td className="whitespace-nowrap px-5 py-4">
                                  <p className="font-semibold text-slate-800">
                                    {formatStatus(
                                      crop.cropShareType,
                                    )}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {formatShare(
                                      crop,
                                    )}
                                  </p>
                                </td>

                                <td className="whitespace-nowrap px-5 py-4">
                                  <span
                                    className={
                                      crop.status ===
                                      'active'
                                        ? 'inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700'
                                        : 'inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700'
                                    }
                                  >
                                    {formatStatus(
                                      crop.status,
                                    )}
                                  </span>
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              ),
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-5">
        <h2 className="font-bold text-slate-900">
          Current Financial Activity
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Current costs and expenses for this
          land’s active assignments and crops will
          appear here when those modules are
          connected. Closed and settled records
          will not be included.
        </p>
      </section>
    </div>
  )
}

export default LandDetailsPage