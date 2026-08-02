import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  LoaderCircle,
  Map,
  MapPin,
  Pencil,
  Plus,
  Search,
  Sprout,
  Trash2,
} from 'lucide-react'
import LandFormModal from '../components/LandFormModal'
import {
  createLand,
  deleteLand,
  getLands,
  updateLand,
} from '../services/landService'
import type { CreateLandInput, Land } from '../types/land'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value)
}

function LandsPage() {
  const [lands, setLands] = useState<Land[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLand, setEditingLand] = useState<Land | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const loadLands = async () => {
    try {
      setIsLoading(true)
      setPageError('')

      const records = await getLands()
      setLands(records)
    } catch (error) {
      console.error(error)
      setPageError(
        'Unable to load land records. Please check the Firestore database and security rules.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadLands()
  }, [])

  const totalAcres = lands.reduce(
    (total, land) => total + land.totalAcres,
    0,
  )

  // This will later be calculated from active land assignments and crops.
  const utilizedAcres = 0
  const unutilizedAcres = Math.max(totalAcres - utilizedAcres, 0)

  const annualLeaseCost = lands.reduce(
    (total, land) => total + land.annualLeaseAmount,
    0,
  )

  const filteredLands = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    if (!normalizedSearch) {
      return lands
    }

    return lands.filter((land) =>
      [
        land.landName,
        land.location,
        land.ownership,
        land.soilType,
      ].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      ),
    )
  }, [lands, searchTerm])

  const landSummary = [
    {
      title: 'Total Land',
      value: `${totalAcres.toLocaleString()} Acres`,
      description: 'Owned and leased land',
      icon: Map,
      style: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Utilized Land',
      value: `${utilizedAcres.toLocaleString()} Acres`,
      description: 'Currently assigned to active crops',
      icon: Sprout,
      style: 'bg-lime-100 text-lime-700',
    },
    {
      title: 'Unutilized Land',
      value: `${unutilizedAcres.toLocaleString()} Acres`,
      description: 'Available for future crop allocation',
      icon: MapPin,
      style: 'bg-amber-100 text-amber-700',
    },
    {
      title: 'Annual Lease Cost',
      value: formatCurrency(annualLeaseCost),
      description: 'Total yearly cost of leased land',
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

  const handleFormSubmit = async (input: CreateLandInput) => {
    if (editingLand) {
      await updateLand(editingLand.id, input)
    } else {
      await createLand(input)
    }

    await loadLands()
  }

  const handleDelete = async (land: Land) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${land.landName}"?`,
    )

    if (!confirmed) {
      return
    }

    try {
      setPageError('')
      await deleteLand(land.id)
      await loadLands()
    } catch (error) {
      console.error(error)
      setPageError('Unable to delete the land record.')
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
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Land Records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {lands.length} land record{lands.length === 1 ? '' : 's'}
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
                placeholder="Search lands..."
                className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    'Land Name',
                    'Location',
                    'Total Acres',
                    'Utilized',
                    'Available',
                    'Ownership',
                    'Annual Lease',
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
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-emerald-700" />

                      <p className="mt-3 text-sm text-slate-500">
                        Loading land records...
                      </p>
                    </td>
                  </tr>
                ) : filteredLands.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
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
                          ? 'Add your first owned or leased land record to begin.'
                          : 'Try changing your search text.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLands.map((land) => {
                    const availableAcres = land.totalAcres

                    return (
                      <tr
                        key={land.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {land.landName}
                          </p>

                          {land.soilType && (
                            <p className="mt-1 text-xs text-slate-400">
                              {land.soilType}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {land.location}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-900">
                          {land.totalAcres.toLocaleString()}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          0
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          {availableAcres.toLocaleString()}
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
                            ? formatCurrency(land.annualLeaseAmount)
                            : '—'}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              aria-label={`Edit ${land.landName}`}
                              onClick={() => openEditForm(land)}
                              className="rounded-lg p-2 text-sky-700 transition hover:bg-sky-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              aria-label={`Delete ${land.landName}`}
                              onClick={() => void handleDelete(land)}
                              className="rounded-lg p-2 text-rose-700 transition hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
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