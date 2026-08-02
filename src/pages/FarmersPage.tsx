import { useEffect, useMemo, useState } from 'react'
import {
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react'
import FarmerFormModal from '../components/FarmerFormModal'
import {
  createFarmer,
  deleteFarmer,
  getFarmers,
  updateFarmer,
} from '../services/farmerService'
import type { CreateFarmerInput, Farmer } from '../types/farmer'

function FarmersPage() {
  const [farmers, setFarmers] = useState<Farmer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const loadFarmers = async () => {
    try {
      setIsLoading(true)
      setPageError('')
      setFarmers(await getFarmers())
    } catch (error) {
      console.error(error)
      setPageError('Unable to load farmer records.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadFarmers()
  }, [])

  const activeFarmers = farmers.filter(
    (farmer) => farmer.status === 'active',
  ).length

  const inactiveFarmers = farmers.length - activeFarmers

  const filteredFarmers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    if (!query) {
      return farmers
    }

    return farmers.filter((farmer) =>
      [
        farmer.farmerName,
        farmer.casteName,
        farmer.phoneNumber,
        farmer.status,
      ].some((value) => value.toLowerCase().includes(query)),
    )
  }, [farmers, searchTerm])

  const handleSubmit = async (input: CreateFarmerInput) => {
    if (editingFarmer) {
      await updateFarmer(editingFarmer.id, input)
    } else {
      await createFarmer(input)
    }

    await loadFarmers()
  }

  const handleDelete = async (farmer: Farmer) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${farmer.farmerName}"?`,
    )

    if (!confirmed) {
      return
    }

    try {
      await deleteFarmer(farmer.id)
      await loadFarmers()
    } catch (error) {
      console.error(error)
      setPageError('Unable to delete the farmer record.')
    }
  }

  const summaryCards = [
    {
      title: 'Total Farmers',
      value: farmers.length,
      icon: Users,
      style: 'bg-sky-100 text-sky-700',
    },
    {
      title: 'Active Farmers',
      value: activeFarmers,
      icon: UserCheck,
      style: 'bg-emerald-100 text-emerald-700',
    },
    {
      title: 'Inactive Farmers',
      value: inactiveFarmers,
      icon: UserX,
      style: 'bg-amber-100 text-amber-700',
    },
  ]

  return (
    <>
      <div className="space-y-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              Farm Setup
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Farmers
            </h1>

            <p className="mt-2 text-slate-500">
              Manage farmer records and prepare land assignments.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingFarmer(null)
              setIsFormOpen(true)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800"
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

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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

                <p className="mt-5 text-sm text-slate-500">
                  {card.title}
                </p>

                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {card.value}
                </p>
              </div>
            )
          })}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Farmer Records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {farmers.length} farmer record
                {farmers.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="flex w-full items-center gap-3 rounded-xl border border-slate-200 px-4 py-2.5 sm:w-80">
              <Search className="h-5 w-5 text-slate-400" />

              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search farmers..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    'Farmer Name',
                    'Community / Caste',
                    'Phone Number',
                    'Status',
                    'Actions',
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-emerald-700" />
                      <p className="mt-3 text-sm text-slate-500">
                        Loading farmer records...
                      </p>
                    </td>
                  </tr>
                ) : filteredFarmers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <Users className="mx-auto h-10 w-10 text-sky-600" />
                      <h3 className="mt-4 font-bold text-slate-900">
                        {farmers.length === 0
                          ? 'No farmer records yet'
                          : 'No matching farmers found'}
                      </h3>
                    </td>
                  </tr>
                ) : (
                  filteredFarmers.map((farmer) => (
                    <tr key={farmer.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {farmer.farmerName}
                        </p>
                        {farmer.notes && (
                          <p className="mt-1 text-xs text-slate-400">
                            {farmer.notes}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {farmer.casteName || '—'}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {farmer.phoneNumber || '—'}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            farmer.status === 'active'
                              ? 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700'
                              : 'rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600'
                          }
                        >
                          {farmer.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingFarmer(farmer)
                              setIsFormOpen(true)
                            }}
                            className="rounded-lg p-2 text-sky-700 hover:bg-sky-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(farmer)}
                            className="rounded-lg p-2 text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <FarmerFormModal
        isOpen={isFormOpen}
        farmer={editingFarmer}
        onClose={() => {
          setIsFormOpen(false)
          setEditingFarmer(null)
        }}
        onSubmit={handleSubmit}
      />
    </>
  )
}

export default FarmersPage