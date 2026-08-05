import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Archive,
  Building2,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Store,
  Trash2,
  Users,
} from 'lucide-react'
import SupplierFormModal from '../components/SupplierFormModal'
import { useAuth } from '../contexts/AuthContext'
import {
  archiveSupplier,
  calculateSupplierSummary,
  createSupplier,
  deleteSupplier,
  getSuppliers,
  restoreSupplier,
  updateSupplier,
} from '../services/supplierService'
import type {
  CreateSupplierInput,
  Supplier,
  SupplierCategory,
} from '../types/supplier'

const categoryLabels: Record<
  SupplierCategory,
  string
> = {
  seed: 'Seed',
  fertilizer: 'Fertilizer',
  pesticide: 'Pesticide',
  equipment: 'Equipment',
  fuel: 'Fuel',
  general: 'General',
}

function SuppliersPage() {
  const { activeWorkspace } = useAuth()

  const [suppliers, setSuppliers] =
    useState<Supplier[]>([])

  const [searchTerm, setSearchTerm] =
    useState('')

  const [
    showArchivedSuppliers,
    setShowArchivedSuppliers,
  ] = useState(false)

  const [isFormOpen, setIsFormOpen] =
    useState(false)

  const [
    editingSupplier,
    setEditingSupplier,
  ] = useState<Supplier | null>(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [pageError, setPageError] =
    useState('')

  const [
    deletingSupplierId,
    setDeletingSupplierId,
  ] = useState<string | null>(null)

  const [
    updatingStatusSupplierId,
    setUpdatingStatusSupplierId,
  ] = useState<string | null>(null)

  const organizationId =
    activeWorkspace?.organization.id ?? ''

  const loadPageData = async () => {
    try {
      setIsLoading(true)
      setPageError('')

      const supplierRecords =
        organizationId
          ? await getSuppliers(
              organizationId,
            )
          : await getSuppliers()

      setSuppliers(supplierRecords)
    } catch (error) {
      console.error(
        'Unable to load suppliers:',
        error,
      )

      setPageError(
        'Unable to load suppliers. Please check Firestore and try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPageData()
  }, [organizationId])

  const summary = useMemo(
    () =>
      calculateSupplierSummary(
        suppliers,
      ),
    [suppliers],
  )

  const filteredSuppliers = useMemo(
    () => {
      const normalizedSearch =
        searchTerm.trim().toLowerCase()

      return suppliers.filter(
        (supplier) => {
          if (
            !showArchivedSuppliers &&
            supplier.status === 'archived'
          ) {
            return false
          }

          if (!normalizedSearch) {
            return true
          }

          const searchableValues = [
            supplier.supplierCode,
            supplier.supplierName,
            supplier.businessName,
            categoryLabels[
              supplier.category
            ],
            supplier.phoneNumber,
            supplier.address,
          ]

          return searchableValues.some(
            (value) =>
              value
                .toLowerCase()
                .includes(
                  normalizedSearch,
                ),
          )
        },
      )
    },
    [
      searchTerm,
      showArchivedSuppliers,
      suppliers,
    ],
  )

  const openAddForm = () => {
    setEditingSupplier(null)
    setIsFormOpen(true)
  }

  const openEditForm = (
    supplier: Supplier,
  ) => {
    setEditingSupplier(supplier)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingSupplier(null)
  }

  const handleSubmit = async (
    input: CreateSupplierInput,
  ) => {
    const inputWithWorkspace: CreateSupplierInput =
      {
        ...input,
        organizationId,
      }

    if (editingSupplier) {
      await updateSupplier(
        editingSupplier.id,
        inputWithWorkspace,
      )
    } else {
      await createSupplier(
        inputWithWorkspace,
      )
    }

    closeForm()
    await loadPageData()
  }

  const handleArchive = async (
    supplier: Supplier,
  ) => {
    const confirmed = window.confirm(
      `Archive ${supplier.supplierName}?`,
    )

    if (!confirmed) {
      return
    }

    try {
      setUpdatingStatusSupplierId(
        supplier.id,
      )
      setPageError('')

      await archiveSupplier(supplier.id)
      await loadPageData()
    } catch (error) {
      console.error(
        'Unable to archive supplier:',
        error,
      )

      setPageError(
        'Unable to archive the supplier. Please try again.',
      )
    } finally {
      setUpdatingStatusSupplierId(null)
    }
  }

  const handleRestore = async (
    supplier: Supplier,
  ) => {
    try {
      setUpdatingStatusSupplierId(
        supplier.id,
      )
      setPageError('')

      await restoreSupplier(supplier.id)
      await loadPageData()
    } catch (error) {
      console.error(
        'Unable to restore supplier:',
        error,
      )

      setPageError(
        'Unable to restore the supplier. Please try again.',
      )
    } finally {
      setUpdatingStatusSupplierId(null)
    }
  }

  const handleDelete = async (
    supplier: Supplier,
  ) => {
    const confirmed = window.confirm(
      `Permanently delete ${supplier.supplierName}?\n\nOnly continue if this supplier has no purchase or payment records.`,
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingSupplierId(
        supplier.id,
      )
      setPageError('')

      await deleteSupplier(supplier.id)
      await loadPageData()
    } catch (error) {
      console.error(
        'Unable to delete supplier:',
        error,
      )

      setPageError(
        'Unable to delete the supplier. Please try again.',
      )
    } finally {
      setDeletingSupplierId(null)
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
              Suppliers
            </h1>

            <p className="mt-2 text-slate-500">
              Manage suppliers for farm purchases and payments.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800"
          >
            <Plus className="h-5 w-5" />
            Add Supplier
          </button>
        </section>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-sky-100 text-sky-700">
              <Users className="h-6 w-6" />
            </div>

            <p className="mt-5 text-slate-500">
              Total Suppliers
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-950">
              {summary.totalSuppliers}
            </p>

            <p className="mt-2 text-sm text-slate-400">
              All supplier records
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <Store className="h-6 w-6" />
            </div>

            <p className="mt-5 text-slate-500">
              Active Suppliers
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-950">
              {summary.activeSuppliers}
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Available for new purchases
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <Archive className="h-6 w-6" />
            </div>

            <p className="mt-5 text-slate-500">
              Archived Suppliers
            </p>

            <p className="mt-1 text-3xl font-bold text-slate-950">
              {summary.archivedSuppliers}
            </p>

            <p className="mt-2 text-sm text-slate-400">
              Inactive supplier records
            </p>
          </article>
        </section>

        {pageError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
          >
            {pageError}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Supplier Records
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredSuppliers.length}{' '}
                {filteredSuppliers.length === 1
                  ? 'displayed supplier'
                  : 'displayed suppliers'}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  setShowArchivedSuppliers(
                    (currentValue) =>
                      !currentValue,
                  )
                }
                className="h-12 rounded-xl border border-slate-300 px-4 font-medium text-slate-700 transition hover:bg-slate-50"
              >
                {showArchivedSuppliers
                  ? 'Hide Archived'
                  : 'Show Archived'}
              </button>

              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value,
                    )
                  }
                  placeholder="Search suppliers..."
                  className="h-12 w-full rounded-xl border border-slate-300 pl-12 pr-4 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 sm:w-80"
                />
              </label>
            </div>
          </header>

          {isLoading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="flex items-center gap-3 text-slate-500">
                <LoaderCircle className="h-6 w-6 animate-spin" />
                <span>
                  Loading suppliers...
                </span>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">
                      Supplier
                    </th>

                    <th className="px-5 py-4">
                      Business
                    </th>

                    <th className="px-5 py-4">
                      Category
                    </th>

                    <th className="px-5 py-4">
                      Phone
                    </th>

                    <th className="px-5 py-4">
                      Address
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">                  {filteredSuppliers.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-16 text-center"
                      >
                        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                          <Building2 className="h-7 w-7" />
                        </div>

                        <h3 className="mt-4 font-bold text-slate-900">
                          {suppliers.length === 0
                            ? 'No suppliers yet'
                            : 'No matching suppliers found'}
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                          {suppliers.length === 0
                            ? 'Add the first supplier to prepare for farm purchases.'
                            : 'Try changing the search or archived-supplier filter.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map(
                      (supplier) => {
                        const isUpdatingStatus =
                          updatingStatusSupplierId ===
                          supplier.id

                        const isDeleting =
                          deletingSupplierId ===
                          supplier.id

                        return (
                          <tr
                            key={supplier.id}
                            className="transition hover:bg-slate-50"
                          >
                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-900">
                                {
                                  supplier.supplierName
                                }
                              </p>

                              <p className="mt-1 text-xs font-semibold text-emerald-700">
                                {
                                  supplier.supplierCode
                                }
                              </p>

                              {supplier.notes && (
                                <p className="mt-1 max-w-48 truncate text-xs text-slate-400">
                                  {
                                    supplier.notes
                                  }
                                </p>
                              )}
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-600">
                              {supplier.businessName ||
                                '—'}
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                                {
                                  categoryLabels[
                                    supplier
                                      .category
                                  ]
                                }
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                              {supplier.phoneNumber ||
                                '—'}
                            </td>

                            <td className="px-5 py-4 text-sm text-slate-600">
                              <span className="block max-w-48 truncate">
                                {supplier.address ||
                                  '—'}
                              </span>
                            </td>

                            <td className="whitespace-nowrap px-5 py-4">
                              <span
                                className={[
                                  'inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize',
                                  supplier.status ===
                                  'active'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-200 text-slate-600',
                                ].join(' ')}
                              >
                                {supplier.status}
                              </span>
                            </td>

                       <td className="relative z-20 whitespace-nowrap px-5 py-4">
  <div className="relative z-20 flex items-center gap-1 pointer-events-auto">
                                <button
  type="button"
  aria-label="Edit supplier"
  title="Edit supplier"
  onClick={(event) => {
    event.preventDefault()
    event.stopPropagation()
    openEditForm(supplier)
  }}
  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
>
  <Pencil className="h-4 w-4" />
  Edit
</button>

{supplier.status === 'active' ? (
  <button
    type="button"
    aria-label="Archive supplier"
    title="Archive supplier"
    disabled={isUpdatingStatus}
    onClick={(event) => {
      event.preventDefault()
      event.stopPropagation()
      void handleArchive(supplier)
    }}
    className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {isUpdatingStatus ? (
      <LoaderCircle className="h-4 w-4 animate-spin" />
    ) : (
      <Archive className="h-4 w-4" />
    )}
    Archive
  </button>
) : (
                                  <>
                                    <button
                                      type="button"
                                      aria-label="Restore supplier"
                                      title="Restore supplier"
                                      disabled={
                                        isUpdatingStatus
                                      }
                                      onClick={() =>
                                        void handleRestore(
                                          supplier,
                                        )
                                      }
                                      className="rounded-lg p-2 text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {isUpdatingStatus ? (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <RotateCcw className="h-4 w-4" />
                                      )}
                                    </button>

                                    <button
                                      type="button"
                                      aria-label="Delete supplier"
                                      title="Permanently delete supplier"
                                      disabled={
                                        isDeleting
                                      }
                                      onClick={() =>
                                        void handleDelete(
                                          supplier,
                                        )
                                      }
                                      className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {isDeleting ? (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </button>
                                  </>
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
          )}
        </section>
      </div>

      <SupplierFormModal
        isOpen={isFormOpen}
        supplier={editingSupplier}
        organizationId={organizationId}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />
    </>
  )
}

export default SuppliersPage