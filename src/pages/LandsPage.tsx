import { useEffect, useMemo, useState } from 'react'
import {
  Archive,
  Building2,
  LoaderCircle,
  Map,
  Pencil,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react'
import LandFormModal from '../components/LandFormModal'
import { useAuth } from '../contexts/AuthContext'
import {
  archiveLand,
  calculateLandSummary,
  createLand,
  getLands,
  restoreLand,
  updateLand,
} from '../services/landService'
import type {
  CreateLandInput,
  Land,
  LandOwnershipType,
  LandStatus,
} from '../types/land'

type OwnershipFilter = 'all' | LandOwnershipType
type StatusFilter = 'all' | LandStatus

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

  const [lands, setLands] = useState<Land[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [ownershipFilter, setOwnershipFilter] =
    useState<OwnershipFilter>('all')
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>('active')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLand, setEditingLand] = useState<Land | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const organizationId =
    activeWorkspace?.organization.id ?? ''

  const loadLands = async () => {
    try {
      setIsLoading(true)
      setPageError('')

      /*
       * During development, records created before workspace support
       * may not contain organizationId. When no active workspace is
       * available, getLands() safely loads the existing records.
       */
      const records = organizationId
        ? await getLands(organizationId)
        : await getLands()

      setLands(records)
    } catch (error) {
      console.error('Unable to load lands:', error)

      setPageError(
        'Unable to load land records. Please check the Firestore database and security rules.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadLands()
  }, [organizationId])

  const summary = useMemo(
    () => calculateLandSummary(lands),
    [lands],
  )

  const filteredLands = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase()

    return lands.filter((land) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          land.landName,
          land.location,
          land.landCode,
          land.soilType,
        ].some((value) =>
          value
            .toLowerCase()
            .includes(normalizedSearch),
        )

      const matchesOwnership =
        ownershipFilter === 'all' ||
        land.ownership === ownershipFilter

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
    lands,
    searchTerm,
    ownershipFilter,
    statusFilter,
  ])

  const landSummary = [
    {
      title: 'Total Land Sites',
      value: summary.totalLandSites.toLocaleString(),
      description: 'Active land locations',
      icon: Map,
      style: 'bg-sky-100 text-sky-700',
    },
    {
      title: 'Total Land',
      value: formatAcres(summary.totalLandAcres),
      description: 'Owned and leased land',
      icon: Map,
      style: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Owned Land',
      value: formatAcres(summary.ownedLandAcres),
      description: 'Total active owned land',
      icon: Building2,
      style: 'bg-lime-100 text-lime-700',
    },
    {
      title: 'Leased Land',
      value: formatAcres(summary.leasedLandAcres),
      description: 'Total active leased land',
      icon: Building2,
      style: 'bg-violet-100 text-violet-700',
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
    const inputWithWorkspace: CreateLandInput = {
      ...input,
      organizationId,
    }

    if (editingLand) {
      await updateLand(
        editingLand.id,
        inputWithWorkspace,
      )
    } else {
      await createLand(inputWithWorkspace)
    }

    await loadLands()
  }

  const handleArchive = async (land: Land) => {
    const landLabel =
      land.landName ||
      land.location ||
      land.landCode

    const confirmed = window.confirm(
      `Archive "${landLabel}"?\n\nThe land will be hidden from active records, but its historical data will remain preserved.`,
    )

    if (!confirmed) {
      return
    }

    try {
      setPageError('')
      await archiveLand(land.id)
      await loadLands()
    } catch (error) {
      console.error('Unable to archive land:', error)
      setPageError('Unable to archive the land record.')
    }
  }

  const handleRestore = async (land: Land) => {
    try {
      setPageError('')
      await restoreLand(land.id)
      await loadLands()
    } catch (error) {
      console.error('Unable to restore land:', error)
      setPageError('Unable to restore the land record.')
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
              Manage owned and leased agricultural land records.
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
              <div
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
              </div>
            )
          })}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Land Records
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {filteredLands.length} displayed record
                  {filteredLands.length === 1 ? '' : 's'}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5 sm:w-72">
                  <Search className="h-5 w-5 text-slate-400" />

                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) =>
                      setSearchTerm(event.target.value)
                    }
                    placeholder="Search name or location..."
                    className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </div>

                <select
                  value={ownershipFilter}
                  onChange={(event) =>
                    setOwnershipFilter(
                      event.target.value as OwnershipFilter,
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="all">
                    All Ownership
                  </option>
                  <option value="owned">Owned</option>
                  <option value="leased">Leased</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as StatusFilter,
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="active">Active</option>
                  <option value="archived">
                    Archived
                  </option>
                  <option value="all">
                    All Statuses
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    'Land',
                    'Location',
                    'Area',
                    'Ownership',
                    'Annual Lease',
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
                        Loading land records...
                      </p>
                    </td>
                  </tr>
                ) : filteredLands.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-16 text-center"
                    >
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                        <Map className="h-7 w-7" />
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
                  filteredLands.map((land) => {
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
                          <p className="font-semibold text-slate-900">
                            {landLabel}
                          </p>

                          {land.soilType && (
                            <p className="mt-1 text-xs text-slate-400">
                              {land.soilType}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {land.location || '—'}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-900">
                          {formatAcres(land.totalAcres)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={[
                              'inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize',
                              land.ownership === 'owned'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-violet-100 text-violet-700',
                            ].join(' ')}
                          >
                            {land.ownership}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {land.ownership === 'leased'
                            ? formatCurrency(
                                land.annualLeaseAmount,
                              )
                            : '—'}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={[
                              'inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize',
                              land.status === 'active'
                                ? 'bg-sky-100 text-sky-700'
                                : 'bg-slate-200 text-slate-600',
                            ].join(' ')}
                          >
                            {land.status}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={`Edit ${landLabel}`}
                              onClick={() =>
                                openEditForm(land)
                              }
                              className="rounded-lg p-2 text-sky-700 transition hover:bg-sky-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            {land.status === 'active' ? (
                              <button
                                type="button"
                                aria-label={`Archive ${landLabel}`}
                                onClick={() =>
                                  void handleArchive(land)
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
                                  void handleRestore(land)
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
                  })
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