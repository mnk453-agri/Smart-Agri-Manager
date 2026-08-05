import {
  useEffect,
  useState,
} from 'react'
import type {
  FormEvent,
} from 'react'
import {
  LoaderCircle,
  Save,
  X,
} from 'lucide-react'
import type {
  CreateSupplierInput,
  Supplier,
  SupplierCategory,
  SupplierStatus,
} from '../types/supplier'

type SupplierFormModalProps = {
  isOpen: boolean
  supplier?: Supplier | null
  organizationId?: string
  onClose: () => void
  onSubmit: (
    input: CreateSupplierInput,
  ) => Promise<void>
}

const supplierCategories: Array<{
  value: SupplierCategory
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
    value: 'general',
    label: 'General',
  },
]

function createInitialForm(
  organizationId = '',
): CreateSupplierInput {
  return {
    organizationId,

    supplierName: '',
    businessName: '',
    category: 'general',

    phoneNumber: '',
    address: '',
    notes: '',

    status: 'active',
  }
}

function createSupplierForm(
  supplier: Supplier,
  organizationId = '',
): CreateSupplierInput {
  return {
    organizationId:
      supplier.organizationId ||
      organizationId,

    supplierName: supplier.supplierName,
    businessName: supplier.businessName,
    category: supplier.category,

    phoneNumber: supplier.phoneNumber,
    address: supplier.address,
    notes: supplier.notes,

    status: supplier.status,
  }
}

function SupplierFormModal({
  isOpen,
  supplier,
  organizationId = '',
  onClose,
  onSubmit,
}: SupplierFormModalProps) {
  const [form, setForm] =
    useState<CreateSupplierInput>(
      createInitialForm(organizationId),
    )

  const [isSaving, setIsSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (supplier) {
      setForm(
        createSupplierForm(
          supplier,
          organizationId,
        ),
      )
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
    supplier,
  ])

  const updateField = <
    Key extends keyof CreateSupplierInput,
  >(
    field: Key,
    value: CreateSupplierInput[Key],
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }))

    setError('')
  }

  const handleStatusChange = (
    value: string,
  ) => {
    updateField(
      'status',
      value as SupplierStatus,
    )
  }

  const handleCategoryChange = (
    value: string,
  ) => {
    updateField(
      'category',
      value as SupplierCategory,
    )
  }

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setError('')

    if (!form.supplierName.trim()) {
      setError(
        'Supplier name is required.',
      )
      return
    }

    if (!form.category) {
      setError(
        'Supplier category is required.',
      )
      return
    }

    try {
      setIsSaving(true)

      await onSubmit({
        ...form,
        organizationId,
        supplierName:
          form.supplierName.trim(),
        businessName:
          form.businessName.trim(),
        phoneNumber:
          form.phoneNumber.trim(),
        address:
          form.address.trim(),
        notes:
          form.notes.trim(),
      })
    } catch (submitError) {
      console.error(
        'Unable to save supplier:',
        submitError,
      )

      setError(
        'Unable to save the supplier. Please try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }
  if (!isOpen) {
    return null
  }

  const modalTitle = supplier
    ? 'Update Supplier'
    : 'Add New Supplier'

  const modalDescription = supplier
    ? 'Update the supplier information below.'
    : 'Enter the supplier details below.'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose()
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="supplier-form-title"
        className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2
              id="supplier-form-title"
              className="text-2xl font-bold text-slate-900"
            >
              {modalTitle}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {modalDescription}
            </p>
          </div>

          <button
            type="button"
            aria-label="Close supplier form"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col"
        >
          <div className="space-y-4 px-6 py-4">
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
              >
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Supplier Name *
                </span>

                <input
                  type="text"
                  value={form.supplierName}
                  onChange={(event) =>
                    updateField(
                      'supplierName',
                      event.target.value,
                    )
                  }
                  placeholder="Example: Muhammad Ali"
                  autoFocus
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Business Name
                </span>

                <input
                  type="text"
                  value={form.businessName}
                  onChange={(event) =>
                    updateField(
                      'businessName',
                      event.target.value,
                    )
                  }
                  placeholder="Shop or company name"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Supplier Category *
                </span>

                <select
                  value={form.category}
                  onChange={(event) =>
                    handleCategoryChange(
                      event.target.value,
                    )
                  }
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  {supplierCategories.map(
                    (category) => (
                      <option
                        key={category.value}
                        value={category.value}
                      >
                        {category.label}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Phone Number
                </span>

                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(event) =>
                    updateField(
                      'phoneNumber',
                      event.target.value,
                    )
                  }
                  placeholder="Example: 03001234567"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Address
                </span>

                <input
                  type="text"
                  value={form.address}
                  onChange={(event) =>
                    updateField(
                      'address',
                      event.target.value,
                    )
                  }
                  placeholder="Village, city or market location"
                  className="h-12 w-full rounded-xl border border-slate-300 px-4 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Status
                </span>

                <select
                  value={form.status}
                  onChange={(event) =>
                    handleStatusChange(
                      event.target.value,
                    )
                  }
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 capitalize text-slate-800 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="archived">
                    Archived
                  </option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Notes
              </span>

              <textarea
                value={form.notes}
                onChange={(event) =>
                  updateField(
                    'notes',
                    event.target.value,
                  )
                }
                placeholder="Optional information about this supplier"
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="h-12 rounded-xl border border-slate-300 px-6 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}

              {isSaving
                ? 'Saving...'
                : supplier
                  ? 'Update Supplier'
                  : 'Save Supplier'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default SupplierFormModal