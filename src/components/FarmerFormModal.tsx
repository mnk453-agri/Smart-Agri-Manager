import { useEffect, useState } from 'react'
import { LoaderCircle, Save, X } from 'lucide-react'
import type {
  CreateFarmerInput,
  Farmer,
  FarmerStatus,
} from '../types/farmer'

type FarmerFormModalProps = {
  isOpen: boolean
  farmer?: Farmer | null
  onClose: () => void
  onSubmit: (input: CreateFarmerInput) => Promise<void>
}

const initialForm: CreateFarmerInput = {
  farmerName: '',
  casteName: '',
  phoneNumber: '',
  status: 'active',
  notes: '',
}

function FarmerFormModal({
  isOpen,
  farmer,
  onClose,
  onSubmit,
}: FarmerFormModalProps) {
  const [form, setForm] = useState<CreateFarmerInput>(initialForm)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (farmer) {
      setForm({
        farmerName: farmer.farmerName,
        casteName: farmer.casteName,
        phoneNumber: farmer.phoneNumber,
        status: farmer.status,
        notes: farmer.notes,
      })
    } else {
      setForm(initialForm)
    }

    setError('')
  }, [farmer, isOpen])

  if (!isOpen) {
    return null
  }

  const updateField = <K extends keyof CreateFarmerInput>(
    field: K,
    value: CreateFarmerInput[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setError('')

    if (!form.farmerName.trim()) {
      setError('Farmer name is required.')
      return
    }

    try {
      setIsSaving(true)

      await onSubmit({
        ...form,
        farmerName: form.farmerName.trim(),
        casteName: form.casteName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        notes: form.notes.trim(),
      })

      onClose()
    } catch (submitError) {
      console.error(submitError)
      setError('Unable to save the farmer record. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close form"
        className="absolute inset-0 bg-slate-950/50"
        onClick={onClose}
      />

      <section className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {farmer ? 'Edit Farmer' : 'Add New Farmer'}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the farmer details below.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Farmer Name *
            </span>

            <input
              type="text"
              value={form.farmerName}
              onChange={(event) =>
                updateField('farmerName', event.target.value)
              }
              placeholder="Enter farmer name"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label>
              <span className="text-sm font-semibold text-slate-700">
                Community / Caste
              </span>

              <input
                type="text"
                value={form.casteName}
                onChange={(event) =>
                  updateField('casteName', event.target.value)
                }
                placeholder="Enter community or caste"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Phone Number
              </span>

              <input
                type="tel"
                value={form.phoneNumber}
                onChange={(event) =>
                  updateField('phoneNumber', event.target.value)
                }
                placeholder="Example: 0300 1234567"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="sm:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Status
              </span>

              <select
                value={form.status}
                onChange={(event) =>
                  updateField(
                    'status',
                    event.target.value as FarmerStatus,
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Notes
            </span>

            <textarea
              rows={4}
              value={form.notes}
              onChange={(event) =>
                updateField('notes', event.target.value)
              }
              placeholder="Optional information about the farmer"
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}

              {isSaving
                ? 'Saving...'
                : farmer
                  ? 'Update Farmer'
                  : 'Save Farmer'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default FarmerFormModal