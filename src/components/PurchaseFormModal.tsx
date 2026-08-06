import {
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  LoaderCircle,
  Save,
  X,
} from 'lucide-react'
import type { Crop } from '../types/crop'
import type { Farmer } from '../types/farmer'
import type { Land } from '../types/land'
import type {
  CreatePurchaseInput,
  Purchase,
  PurchaseCategory,
  PurchaseUnit,
} from '../types/purchase'
import type { Supplier } from '../types/supplier'

type PurchaseFormModalProps = {
  isOpen: boolean
  purchase?: Purchase | null
  organizationId?: string
  suppliers?: Supplier[]
  crops?: Crop[]
  lands?: Land[]
  farmers?: Farmer[]
  onClose: () => void
  onSubmit: (
    input: CreatePurchaseInput,
  ) => Promise<void>
}

type PurchaseFormState = {
  organizationId: string

  supplierId: string
  cropId: string
  landId: string
  farmerId: string

  itemName: string
  category: PurchaseCategory

  quantity: number
  unit: PurchaseUnit
  unitPrice: number
  paidAmount: number

  purchaseDate: string
  invoiceNumber: string
  notes: string
}

const categoryOptions: Array<{
  value: PurchaseCategory
  label: string
}> = [
  {
    value: 'seed',
    label: 'Seed',
  },
  {
    value: 'fertilizer',
    label: 'Fertilizer',
  },
  {
    value: 'pesticide',
    label: 'Pesticide',
  },
  {
    value: 'equipment',
    label: 'Equipment',
  },
  {
    value: 'fuel',
    label: 'Fuel',
  },
  {
    value: 'irrigation',
    label: 'Irrigation',
  },
  {
    value: 'labour',
    label: 'Labour',
  },
  {
    value: 'other',
    label: 'Other',
  },
]

const unitOptions: Array<{
  value: PurchaseUnit
  label: string
}> = [
  {
    value: 'kg',
    label: 'Kilogram (kg)',
  },
  {
    value: 'bag',
    label: 'Bag',
  },
  {
    value: 'litre',
    label: 'Litre',
  },
  {
    value: 'piece',
    label: 'Piece',
  },
  {
    value: 'unit',
    label: 'Unit',
  },
  {
    value: 'service',
    label: 'Service',
  },
  {
    value: 'other',
    label: 'Other',
  },
]

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(
    today.getMonth() + 1,
  ).padStart(2, '0')
  const day = String(
    today.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function createInitialForm(
  organizationId = '',
): PurchaseFormState {
  return {
    organizationId,

    supplierId: '',
    cropId: '',
    landId: '',
    farmerId: '',

    itemName: '',
    category: 'other',

    quantity: 0,
    unit: 'unit',
    unitPrice: 0,
    paidAmount: 0,

    purchaseDate: getTodayDate(),
    invoiceNumber: '',
    notes: '',
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatAcres(value: number) {
  return `${value.toLocaleString()} Acres`
}

function PurchaseFormModal({
  isOpen,
  purchase,
  organizationId = '',
  suppliers = [],
  crops = [],
  lands = [],
  farmers = [],
  onClose,
  onSubmit,
}: PurchaseFormModalProps) {
  const [form, setForm] =
    useState<PurchaseFormState>(
      createInitialForm(organizationId),
    )

  const [error, setError] = useState('')
  const [isSaving, setIsSaving] =
    useState(false)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (purchase) {
      setForm({
        organizationId:
          purchase.organizationId ||
          organizationId,

        supplierId: purchase.supplierId,
        cropId: purchase.cropId,
        landId: purchase.landId,
        farmerId: purchase.farmerId,

        itemName: purchase.itemName,
        category: purchase.category,

        quantity: purchase.quantity,
        unit: purchase.unit,
        unitPrice: purchase.unitPrice,
        paidAmount: purchase.paidAmount,

        purchaseDate: purchase.purchaseDate,
        invoiceNumber: purchase.invoiceNumber,
        notes: purchase.notes,
      })
    } else {
      setForm(
        createInitialForm(organizationId),
      )
    }

    setError('')
    setIsSaving(false)
  }, [
    isOpen,
    organizationId,
    purchase,
  ])

  useEffect(() => {
    if (!isOpen || !form.cropId) {
      return
    }

    const selectedCrop = crops.find(
      (crop) => crop.id === form.cropId,
    )

    if (!selectedCrop) {
      return
    }

    setForm((currentForm) => ({
      ...currentForm,
      landId: selectedCrop.landId,
      farmerId: selectedCrop.farmerId,
    }))
  }, [
    crops,
    form.cropId,
    isOpen,
  ])

  const activeSuppliers = useMemo(
    () =>
      suppliers.filter(
        (supplier) =>
          supplier.status === 'active' ||
          supplier.id === purchase?.supplierId,
      ),
    [
      purchase?.supplierId,
      suppliers,
    ],
  )

  const currentCrops = useMemo(
    () =>
      crops.filter(
        (crop) =>
          crop.status === 'planned' ||
          crop.status === 'active' ||
          crop.id === purchase?.cropId,
      ),
    [
      crops,
      purchase?.cropId,
    ],
  )

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

  const selectedSupplier =
    supplierById.get(form.supplierId)

  const selectedCrop = currentCrops.find(
    (crop) => crop.id === form.cropId,
  )

  const selectedLand = landById.get(
    form.landId,
  )

  const selectedFarmer = farmerById.get(
    form.farmerId,
  )

  const financialValues = useMemo(() => {
    const quantity = Math.max(
      Number(form.quantity) || 0,
      0,
    )

    const unitPrice = Math.max(
      Number(form.unitPrice) || 0,
      0,
    )

    const totalAmount =
      quantity * unitPrice

    const paidAmount = Math.min(
      Math.max(
        Number(form.paidAmount) || 0,
        0,
      ),
      totalAmount,
    )

    const balanceAmount = Math.max(
      totalAmount - paidAmount,
      0,
    )

    const status =
      paidAmount <= 0
        ? 'unpaid'
        : paidAmount >= totalAmount
          ? 'paid'
          : 'partially_paid'

    return {
      totalAmount,
      paidAmount,
      balanceAmount,
      status,
    } as const
  }, [
    form.paidAmount,
    form.quantity,
    form.unitPrice,
  ])

  const handleCropChange = (
    cropId: string,
  ) => {
    const crop = crops.find(
      (cropRecord) =>
        cropRecord.id === cropId,
    )

    setForm((currentForm) => ({
      ...currentForm,
      cropId,
      landId: crop?.landId ?? '',
      farmerId: crop?.farmerId ?? '',
    }))

    setError('')
  }

  const handleNumberChange = (
    field:
      | 'quantity'
      | 'unitPrice'
      | 'paidAmount',
    value: string,
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]:
        value === ''
          ? 0
          : Math.max(Number(value), 0),
    }))

    setError('')
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setError('')

    

    if (!form.supplierId) {
      setError('Please select a supplier.')
      return
    }

    if (!form.itemName.trim()) {
      setError('Item name is required.')
      return
    }

    if (form.quantity <= 0) {
      setError(
        'Quantity must be greater than zero.',
      )
      return
    }

    if (form.unitPrice <= 0) {
      setError(
        'Unit price must be greater than zero.',
      )
      return
    }

    if (financialValues.totalAmount <= 0) {
      setError(
        'Total purchase amount must be greater than zero.',
      )
      return
    }

    if (
      Number(form.paidAmount) >
      financialValues.totalAmount
    ) {
      setError(
        'Paid amount cannot exceed the total purchase amount.',
      )
      return
    }

    if (!form.purchaseDate) {
      setError('Purchase date is required.')
      return
    }

    const input: CreatePurchaseInput = {
      organizationId: form.organizationId,

      supplierId: form.supplierId,
      cropId: form.cropId,
      landId: form.landId,
      farmerId: form.farmerId,

      itemName: form.itemName.trim(),
      category: form.category,

      quantity: Number(form.quantity),
      unit: form.unit,
      unitPrice: Number(form.unitPrice),

      totalAmount:
        financialValues.totalAmount,
      paidAmount:
        financialValues.paidAmount,
      balanceAmount:
        financialValues.balanceAmount,
      status: financialValues.status,

      purchaseDate: form.purchaseDate,
      invoiceNumber:
        form.invoiceNumber.trim(),
      notes: form.notes.trim(),
    }

    try {
      setIsSaving(true)
      await onSubmit(input)
      onClose()
    } catch (submitError) {
      console.error(
        'Unable to save purchase:',
        submitError,
      )

      setError(
        'Unable to save the purchase. Please try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-[2px] sm:p-5">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="purchase-form-title"
        className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100vh-2.5rem)]"
      >
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-7">
          <div>
            <h2
              id="purchase-form-title"
              className="text-2xl font-bold tracking-tight text-slate-900"
            >
              {purchase
                ? 'Edit Purchase'
                : 'Add New Purchase'}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Record a supplier purchase and
              optionally allocate it to a current
              crop.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close purchase form"
            title="Close"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-7">
            {error && (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Supplier *
                </span>

                <select
                  value={form.supplierId}
                  onChange={(event) => {
                    setForm(
                      (currentForm) => ({
                        ...currentForm,
                        supplierId:
                          event.target.value,
                      }),
                    )
                    setError('')
                  }}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">
                    Select supplier
                  </option>

                  {activeSuppliers.map(
                    (supplier) => (
                      <option
                        key={supplier.id}
                        value={supplier.id}
                      >
                        {supplier.supplierCode}
                        {' — '}
                        {supplier.supplierName}
                        {supplier.businessName
                          ? ` — ${supplier.businessName}`
                          : ''}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block lg:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Current Crop Allocation
                  <span className="ml-1 font-normal text-slate-400">
                    (Optional)
                  </span>
                </span>

                <select
                  value={form.cropId}
                  onChange={(event) =>
                    handleCropChange(
                      event.target.value,
                    )
                  }
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">
                    General farm purchase — no crop
                    allocation
                  </option>

                  {currentCrops.map(
                    (cropRecord) => {
                      const cropLand =
                        landById.get(
                          cropRecord.landId,
                        )

                      const cropFarmer =
                        farmerById.get(
                          cropRecord.farmerId,
                        )

                      return (
                        <option
                          key={cropRecord.id}
                          value={cropRecord.id}
                        >
                          {cropRecord.cropCode}
                          {' — '}
                          {cropRecord.cropName}
                          {' — '}
                          {cropLand?.landName ??
                            'Unknown Land'}
                          {' — '}
                          {cropFarmer?.farmerName ??
                            'Unknown Farmer'}
                        </option>
                      )
                    },
                  )}
                </select>
              </label>
            </div>

            {(selectedSupplier ||
              selectedCrop) && (
              <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Supplier
                  </p>
                  <p className="mt-1 font-bold text-slate-900">
                    {selectedSupplier
                      ?.supplierName ?? '—'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedSupplier
                      ?.businessName || 'No business name'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Crop
                  </p>
                  <p className="mt-1 font-bold text-slate-900">
                    {selectedCrop?.cropName ??
                      'General Purchase'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedCrop?.cropCode ??
                      'Not allocated to a crop'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Land
                  </p>
                  <p className="mt-1 font-bold text-slate-900">
                    {selectedLand?.landName ?? '—'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedLand?.landCode ??
                      'No land allocation'}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Farmer
                  </p>
                  <p className="mt-1 font-bold text-slate-900">
                    {selectedFarmer?.farmerName ??
                      '—'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {selectedFarmer?.farmerCode ??
                      'No farmer allocation'}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Item Name *
                </span>

                <input
                  type="text"
                  value={form.itemName}
                  onChange={(event) => {
                    setForm(
                      (currentForm) => ({
                        ...currentForm,
                        itemName:
                          event.target.value,
                      }),
                    )
                    setError('')
                  }}
                  placeholder="Example: Urea fertilizer"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Category *
                </span>

                <select
                  value={form.category}
                  onChange={(event) => {
                    setForm(
                      (currentForm) => ({
                        ...currentForm,
                        category:
                          event.target
                            .value as PurchaseCategory,
                      }),
                    )
                    setError('')
                  }}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  {categoryOptions.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Unit *
                </span>

                <select
                  value={form.unit}
                  onChange={(event) => {
                    setForm(
                      (currentForm) => ({
                        ...currentForm,
                        unit:
                          event.target
                            .value as PurchaseUnit,
                      }),
                    )
                    setError('')
                  }}
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  {unitOptions.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Quantity *
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.quantity === 0
                      ? ''
                      : form.quantity
                  }
                  onChange={(event) =>
                    handleNumberChange(
                      'quantity',
                      event.target.value,
                    )
                  }
                  placeholder="Enter quantity"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Unit Price *
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.unitPrice === 0
                      ? ''
                      : form.unitPrice
                  }
                  onChange={(event) =>
                    handleNumberChange(
                      'unitPrice',
                      event.target.value,
                    )
                  }
                  placeholder="Price per unit"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Paid Now
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.paidAmount === 0
                      ? ''
                      : form.paidAmount
                  }
                  onChange={(event) =>
                    handleNumberChange(
                      'paidAmount',
                      event.target.value,
                    )
                  }
                  placeholder="Amount paid"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Purchase Date *
                </span>

                <input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(event) => {
                    setForm(
                      (currentForm) => ({
                        ...currentForm,
                        purchaseDate:
                          event.target.value,
                      }),
                    )
                    setError('')
                  }}
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </label>              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Invoice Number
                </span>
                <input
                  type="text"
                  value={form.invoiceNumber}
                  onChange={(event) =>
                    setForm((currentForm) => ({
                      ...currentForm,
                      invoiceNumber: event.target.value,
                    }))
                  }
                  placeholder="Optional invoice or receipt number"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
            </div>

            {selectedCrop && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                This purchase will be allocated to{' '}
                <span className="font-semibold">
                  {selectedCrop.cropName}
                </span>{' '}
                covering {formatAcres(selectedCrop.areaAcres)}.
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total
                </p>
                <p className="mt-1 font-bold text-slate-900">
                  {formatCurrency(financialValues.totalAmount)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Paid
                </p>
                <p className="mt-1 font-bold text-emerald-700">
                  {formatCurrency(financialValues.paidAmount)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Balance
                </p>
                <p className="mt-1 font-bold text-orange-700">
                  {formatCurrency(financialValues.balanceAmount)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Payment Status
                </p>
                <p className="mt-1 font-bold capitalize text-slate-900">
                  {financialValues.status === 'unpaid'
  ? 'Credit'
  : financialValues.status === 'partially_paid'
    ? 'Partially Paid'
    : 'Paid'}
                </p>
              </div>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Notes
              </span>
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((currentForm) => ({
                    ...currentForm,
                    notes: event.target.value,
                  }))
                }
                rows={2}
                placeholder="Optional information about this purchase"
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}

              {isSaving
                ? 'Saving...'
                : purchase
                  ? 'Update Purchase'
                  : 'Save Purchase'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default PurchaseFormModal