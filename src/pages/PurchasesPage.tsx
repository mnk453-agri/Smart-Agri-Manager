import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  Archive,
  Banknote,
  ClipboardList,
  LoaderCircle,
  Pencil,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
  WalletCards,
} from 'lucide-react'
import PurchaseFormModal from '../components/PurchaseFormModal'
import { useAuth } from '../contexts/AuthContext'
import { getCrops } from '../services/cropService'
import { getFarmers } from '../services/farmerService'
import { getLands } from '../services/landService'
import {
  calculatePurchaseSummary,
  cancelPurchase,
  createPurchase,
  deletePurchase,
  getPurchases,
  updatePurchase,
} from '../services/purchaseService'
import { getSuppliers } from '../services/supplierService'
import type { Crop } from '../types/crop'
import type { Farmer } from '../types/farmer'
import type { Land } from '../types/land'
import type {
  CreatePurchaseInput,
  Purchase,
  PurchaseCategory,
  PurchaseStatus,
} from '../types/purchase'
import type { Supplier } from '../types/supplier'

const purchaseCategoryLabels: Record<
  PurchaseCategory,
  string
> = {
  seed: 'Seed',
  fertilizer: 'Fertilizer',
  pesticide: 'Pesticide',
  equipment: 'Equipment',
  fuel: 'Fuel',
  irrigation: 'Irrigation',
  labour: 'Labour',
  other: 'Other',
}

const purchaseStatusLabels: Record<
  PurchaseStatus,
  string
> = {
  unpaid: 'Credit',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  cancelled: 'Cancelled',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(value)
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

function getStatusClasses(status: PurchaseStatus) {
  if (status === 'paid') {
    return 'bg-emerald-100 text-emerald-700'
  }

  if (status === 'partially_paid') {
    return 'bg-amber-100 text-amber-700'
  }

  if (status === 'cancelled') {
    return 'bg-slate-200 text-slate-600'
  }

  return 'bg-rose-100 text-rose-700'
}

function PurchasesPage() {
  const { activeWorkspace } = useAuth()

  const [
    purchases,
    setPurchases,
  ] = useState<Purchase[]>([])
  const [
    suppliers,
    setSuppliers,
  ] = useState<Supplier[]>([])
  const [
    crops,
    setCrops,
  ] = useState<Crop[]>([])
  const [
    lands,
    setLands,
  ] = useState<Land[]>([])
  const [
    farmers,
    setFarmers,
  ] = useState<Farmer[]>([])

  const [
    searchTerm,
    setSearchTerm,
  ] = useState('')
  const [
    statusFilter,
    setStatusFilter,
  ] = useState<'current' | 'all' | PurchaseStatus>(
    'current',
  )
  const [
    categoryFilter,
    setCategoryFilter,
  ] = useState<'all' | PurchaseCategory>('all')

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)
  const [
    pageError,
    setPageError,
  ] = useState('')

  const [
    isFormOpen,
    setIsFormOpen,
  ] = useState(false)
  const [
    editingPurchase,
    setEditingPurchase,
  ] = useState<Purchase | null>(null)
  const [
    updatingPurchaseId,
    setUpdatingPurchaseId,
  ] = useState<string | null>(null)

  const organizationId =
    activeWorkspace?.organization.id ?? ''

  const loadPageData = async () => {
    try {
      setIsLoading(true)
      setPageError('')

      const [
        purchaseRecords,
        supplierRecords,
        cropRecords,
        landRecords,
        farmerRecords,
      ] = await Promise.all([
        organizationId
          ? getPurchases(organizationId)
          : getPurchases(),
        organizationId
          ? getSuppliers(organizationId)
          : getSuppliers(),
        organizationId
          ? getCrops(organizationId)
          : getCrops(),
        organizationId
          ? getLands(organizationId)
          : getLands(),
        organizationId
          ? getFarmers(organizationId)
          : getFarmers(),
      ])

      setPurchases(purchaseRecords)
      setSuppliers(supplierRecords)
      setCrops(cropRecords)
      setLands(landRecords)
      setFarmers(farmerRecords)
    } catch (error) {
      console.error(
        'Unable to load purchase data:',
        error,
      )
      setPageError(
        'Unable to load purchases. Please check Firestore and try again.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadPageData()
  }, [organizationId])

  const supplierById = useMemo(
    () =>
      new Map(
        suppliers.map((supplier) => [
          supplier.id,
          supplier,
        ]),
      ),
    [suppliers],
  )

  const cropById = useMemo(
    () =>
      new Map(
        crops.map((crop) => [
          crop.id,
          crop,
        ]),
      ),
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

  const summary = useMemo(
    () => calculatePurchaseSummary(purchases),
    [purchases],
  )

  const filteredPurchases = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase()

    return purchases.filter((purchase) => {
      if (
        statusFilter === 'current' &&
        purchase.status === 'cancelled'
      ) {
        return false
      }

      if (
        statusFilter !== 'current' &&
        statusFilter !== 'all' &&
        purchase.status !== statusFilter
      ) {
        return false
      }

      if (
        categoryFilter !== 'all' &&
        purchase.category !== categoryFilter
      ) {
        return false
      }

      if (!normalizedSearch) {
        return true
      }

      const supplier = supplierById.get(
        purchase.supplierId,
      )
      const crop = cropById.get(purchase.cropId)
      const land = landById.get(purchase.landId)
      const farmer = farmerById.get(
        purchase.farmerId,
      )

      return [
        purchase.purchaseCode,
        purchase.itemName,
        purchase.invoiceNumber,
        purchase.notes,
        supplier?.supplierName ?? '',
        supplier?.businessName ?? '',
        crop?.cropName ?? '',
        land?.landName ?? '',
        farmer?.farmerName ?? '',
        purchaseCategoryLabels[purchase.category],
        purchaseStatusLabels[purchase.status],
      ].some((value) =>
        value.toLowerCase().includes(normalizedSearch),
      )
    })
  }, [
    categoryFilter,
    cropById,
    farmerById,
    landById,
    purchases,
    searchTerm,
    statusFilter,
    supplierById,
  ])

  const openAddForm = () => {
    setEditingPurchase(null)
    setIsFormOpen(true)
  }

  const openEditForm = (purchase: Purchase) => {
    setEditingPurchase(purchase)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    setIsFormOpen(false)
    setEditingPurchase(null)
  }

  const handleSubmit = async (
    input: CreatePurchaseInput,
  ) => {
    const inputWithWorkspace: CreatePurchaseInput = {
      ...input,
      organizationId,
    }

    if (editingPurchase) {
      await updatePurchase(
        editingPurchase.id,
        inputWithWorkspace,
      )
    } else {
      await createPurchase(inputWithWorkspace)
    }

    closeForm()
    await loadPageData()
  }

  const handleCancelPurchase = async (
    purchase: Purchase,
  ) => {
    const confirmed = window.confirm(
      `Cancel ${purchase.purchaseCode} for ${purchase.itemName}?\n\nThe record will remain available for reference, but it will be excluded from current purchase totals.`,
    )

    if (!confirmed) {
      return
    }

    try {
      setUpdatingPurchaseId(purchase.id)
      setPageError('')
      await cancelPurchase(purchase.id)
      await loadPageData()
    } catch (error) {
      console.error(
        'Unable to cancel purchase:',
        error,
      )
      setPageError(
        'Unable to cancel this purchase. Please try again.',
      )
    } finally {
      setUpdatingPurchaseId(null)
    }
  }

  const handleDeletePurchase = async (
    purchase: Purchase,
  ) => {
    const confirmed = window.confirm(
      `Permanently delete ${purchase.purchaseCode} for ${purchase.itemName}?\n\nThis action cannot be undone.`,
    )

    if (!confirmed) {
      return
    }

    try {
      setUpdatingPurchaseId(purchase.id)
      setPageError('')
      await deletePurchase(purchase.id)
      await loadPageData()
    } catch (error) {
      console.error(
        'Unable to delete purchase:',
        error,
      )
      setPageError(
        'Unable to delete this purchase. Please try again.',
      )
    } finally {
      setUpdatingPurchaseId(null)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              Transactions
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Purchases
            </h1>
            <p className="mt-2 text-slate-500">
              Record farm purchases, supplier balances and crop allocations.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            <Plus className="h-5 w-5" />
            Add Purchase
          </button>
        </section>

        {pageError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {pageError}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-sky-100 text-sky-700">
              <ClipboardList className="h-6 w-6" />
            </div>
            <p className="mt-4 text-slate-500">
              Total Purchases
            </p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {summary.totalPurchases}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Current purchase records
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-100 text-violet-700">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <p className="mt-4 text-slate-500">
              Purchase Amount
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatCurrency(
                summary.totalPurchaseAmount,
              )}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Total value of purchases
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <Banknote className="h-6 w-6" />
            </div>
            <p className="mt-4 text-slate-500">
              Amount Paid
            </p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">
              {formatCurrency(summary.totalPaidAmount)}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Payments already made
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <WalletCards className="h-6 w-6" />
            </div>
            <p className="mt-4 text-slate-500">
              Outstanding Balance
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-700">
              {formatCurrency(
                summary.totalBalanceAmount,
              )}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              {summary.unpaidPurchases +
                summary.partiallyPaidPurchases}{' '}
              purchases need payment
            </p>
          </article>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Purchase Records
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {filteredPurchases.length}{' '}
                displayed{' '}
                {filteredPurchases.length === 1
                  ? 'purchase'
                  : 'purchases'}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  placeholder="Search purchases..."
                  className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-4 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 sm:w-72"
                />
              </label>

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value as
                      | 'all'
                      | PurchaseCategory,
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="all">
                  All Categories
                </option>
                {Object.entries(
                  purchaseCategoryLabels,
                ).map(([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | 'current'
                      | 'all'
                      | PurchaseStatus,
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="current">
                  Current
                </option>
                <option value="all">
                  All Statuses
                </option>
                {Object.entries(
                  purchaseStatusLabels,
                ).map(([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </header>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">
                    Purchase
                  </th>
                  <th className="px-5 py-4">
                    Supplier
                  </th>
                  <th className="px-5 py-4">
                    Allocation
                  </th>
                  <th className="px-5 py-4">
                    Quantity
                  </th>
                  <th className="px-5 py-4">
                    Total
                  </th>
                  <th className="px-5 py-4">
                    Paid / Balance
                  </th>
                  <th className="px-5 py-4">
                    Date
                  </th>
                  <th className="px-5 py-4">
                    Status
                  </th>
                  <th className="px-5 py-4">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">                {isLoading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-16 text-center"
                    >
                      <div className="flex items-center justify-center gap-3 text-slate-500">
                        <LoaderCircle className="h-6 w-6 animate-spin" />
                        <span>Loading purchase records...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPurchases.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-14 text-center"
                    >
                      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                        <ReceiptText className="h-7 w-7" />
                      </div>

                      <h3 className="mt-4 font-bold text-slate-900">
                        {purchases.length === 0
                          ? 'No purchases yet'
                          : 'No matching purchases found'}
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        {purchases.length === 0
                          ? 'Add the first farm purchase to begin recording costs and supplier balances.'
                          : 'Try changing the search term or purchase filters.'}
                      </p>

                      <button
                        type="button"
                        onClick={() => void loadPageData()}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reload
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase) => {
                    const supplier = supplierById.get(
                      purchase.supplierId,
                    )
                    const crop = purchase.cropId
                      ? cropById.get(purchase.cropId)
                      : undefined
                    const land = purchase.landId
                      ? landById.get(purchase.landId)
                      : undefined
                    const farmer = purchase.farmerId
                      ? farmerById.get(purchase.farmerId)
                      : undefined
                    const isUpdating =
                      updatingPurchaseId === purchase.id

                    return (
                      <tr
                        key={purchase.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">
                            {purchase.itemName}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-emerald-700">
                            {purchase.purchaseCode}
                          </p>

                          <span className="mt-2 inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                          {purchaseCategoryLabels[purchase.category]}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {supplier?.supplierName ??
                              'Unknown Supplier'}
                          </p>

                          {supplier?.businessName && (
                            <p className="mt-1 text-xs text-slate-500">
                              {supplier.businessName}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          {crop ? (
                            <>
                              <p className="font-semibold text-slate-900">
                                {crop.cropName}
                              </p>

                              {land && (
                                <p className="mt-1 text-xs text-slate-500">
                                  Land: {land.landName}
                                </p>
                              )}

                              {farmer && (
                                <p className="mt-1 text-xs text-slate-500">
                                  Farmer: {farmer.farmerName}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-sm font-medium text-slate-600">
                              General farm purchase
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {purchase.quantity.toLocaleString()}
                          </p>

                          <p className="mt-1 text-xs capitalize text-slate-500">
                            {purchase.unit.replaceAll('_', ' ')}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-900">
                          {formatCurrency(purchase.totalAmount)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="font-semibold text-emerald-700">
                            Paid:{' '}
                            {formatCurrency(purchase.paidAmount)}
                          </p>

                          <p
                            className={[
                              'mt-1 text-xs font-semibold',
                              purchase.balanceAmount > 0
                                ? 'text-amber-700'
                                : 'text-slate-400',
                            ].join(' ')}
                          >
                            Balance:{' '}
                            {formatCurrency(
                              purchase.balanceAmount,
                            )}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <p className="font-medium text-slate-700">
                            {formatDate(purchase.purchaseDate)}
                          </p>

                          {purchase.invoiceNumber && (
                            <p className="mt-1 text-xs text-slate-500">
                              Invoice: {purchase.invoiceNumber}
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <span
                            className={[
                              'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                              getStatusClasses(purchase.status),
                            ].join(' ')}
                          >
                            {purchaseStatusLabels[purchase.status]}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-2">
                            {purchase.status !== 'cancelled' && (
                              <button
                                type="button"
                                onClick={() =>
                                  openEditForm(purchase)
                                }
                                disabled={isUpdating}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </button>
                            )}

                            {purchase.status !== 'cancelled' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleCancelPurchase(
                                    purchase,
                                  )
                                }
                                disabled={isUpdating}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isUpdating ? (
                                  <LoaderCircle className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Archive className="h-4 w-4" />
                                )}
                                Cancel
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleDeletePurchase(
                                    purchase,
                                  )
                                }
                                disabled={isUpdating}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isUpdating ? (
                                  <LoaderCircle className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                                Delete
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

      <PurchaseFormModal
        isOpen={isFormOpen}
        purchase={editingPurchase}
        organizationId={organizationId}
        suppliers={suppliers}
        crops={crops}
        lands={lands}
        farmers={farmers}
        onClose={closeForm}
        onSubmit={handleSubmit}
      />
    </>
  )
}

export default PurchasesPage