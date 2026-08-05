import {
  useEffect,
  useState,
} from 'react'
import {
  LoaderCircle,
  Save,
  X,
} from 'lucide-react'
import type {
  CreateLandInput,
  Land,
  LandOwnershipType as LandOwnership,
} from '../types/land'

type LandFormModalProps = {
  isOpen: boolean
  land?: Land | null
  onClose: () => void
  onSubmit: (
    input: CreateLandInput,
  ) => Promise<void>
}

const initialForm: CreateLandInput = {
  landName: '',
  location: '',
  totalAcres: 0,
  ownership: 'owned',
  soilType: '',
  annualLeaseAmount: 0,
  notes: '',
}

function LandFormModal({
  isOpen,
  land,
  onClose,
  onSubmit,
}: LandFormModalProps) {
  const [form, setForm] =
    useState<CreateLandInput>(
      initialForm,
    )
  const [isSaving, setIsSaving] =
    useState(false)
  const [error, setError] =
    useState('')

  useEffect(() => {
    if (land) {
      setForm({
        landName: land.landName,
        location: land.location,
        totalAcres: land.totalAcres,
        ownership: land.ownership,
        soilType: land.soilType,
        annualLeaseAmount:
          land.annualLeaseAmount,
        notes: land.notes,
      })
    } else {
      setForm(initialForm)
    }

    setError('')
  }, [land, isOpen])

  if (!isOpen) {
    return null
  }

  const updateField = <
    K extends keyof CreateLandInput,
  >(
    field: K,
    value: CreateLandInput[K],
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

    if (!form.landName.trim()) {
      setError(
        'Land name is required.',
      )
      return
    }

    if (!form.location.trim()) {
      setError(
        'Location is required.',
      )
      return
    }

    if (form.totalAcres <= 0) {
      setError(
        'Total acres must be greater than zero.',
      )
      return
    }

    if (
      form.ownership === 'leased' &&
      form.annualLeaseAmount < 0
    ) {
      setError(
        'Annual lease amount cannot be negative.',
      )
      return
    }

    try {
      setIsSaving(true)

      await onSubmit({
        ...form,
        landName:
          form.landName.trim(),
        location:
          form.location.trim(),
        soilType:
          form.soilType.trim(),
        notes: form.notes.trim(),
        annualLeaseAmount:
          form.ownership === 'owned'
            ? 0
            : form.annualLeaseAmount,
      })

      onClose()
    } catch (submitError) {
      console.error(submitError)
      setError(
        'Unable to save the land record. Please try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3">
      <button
        type="button"
        aria-label="Close form"
        className="absolute inset-0 bg-slate-950/50"
        onClick={onClose}
      />

      <section className="relative z-10 flex max-h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {land
                ? 'Edit Land'
                : 'Add New Land'}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter the agricultural land
              details below.
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

        <form
          onSubmit={handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Land Name *
                </span>

                <input
                  type="text"
                  value={form.landName}
                  onChange={(event) =>
                    updateField(
                      'landName',
                      event.target.value,
                    )
                  }
                  placeholder="Example: Main Farm"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Location *
                </span>

                <input
                  type="text"
                  value={form.location}
                  onChange={(event) =>
                    updateField(
                      'location',
                      event.target.value,
                    )
                  }
                  placeholder="Village, city, district or identifying location"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-700">
                  Total Acres *
                </span>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    form.totalAcres || ''
                  }
                  onFocus={(event) =>
                    event.currentTarget.select()
                  }
                  onChange={(event) =>
                    updateField(
                      'totalAcres',
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                  placeholder="0"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-700">
                  Ownership *
                </span>

                <select
                  value={form.ownership}
                  onChange={(event) =>
                    updateField(
                      'ownership',
                      event.target
                        .value as LandOwnership,
                    )
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="owned">
                    Owned
                  </option>
                  <option value="leased">
                    Leased
                  </option>
                </select>
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-700">
                  Soil Type
                </span>

                <input
                  type="text"
                  value={form.soilType}
                  onChange={(event) =>
                    updateField(
                      'soilType',
                      event.target.value,
                    )
                  }
                  placeholder="Example: Clay, sandy or saline"
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label>
                <span className="text-sm font-semibold text-slate-700">
                  Annual Lease Amount
                </span>

                <input
                  type="number"
                  min="0"
                  step="1"
                  disabled={
                    form.ownership ===
                    'owned'
                  }
                  value={
                    form.ownership ===
                    'owned'
                      ? ''
                      : form
                          .annualLeaseAmount ||
                        ''
                  }
                  onFocus={(event) =>
                    event.currentTarget.select()
                  }
                  onChange={(event) =>
                    updateField(
                      'annualLeaseAmount',
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                  placeholder={
                    form.ownership ===
                    'owned'
                      ? 'Not applicable'
                      : 'PKR 0'
                  }
                  className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Notes
              </span>

              <textarea
                rows={2}
                value={form.notes}
                onChange={(event) =>
                  updateField(
                    'notes',
                    event.target.value,
                  )
                }
                placeholder="Optional information about the land"
                className="mt-1.5 w-full resize-none rounded-xl border border-slate-300 px-4 py-2.5 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <footer className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-6 py-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}

              {isSaving
                ? 'Saving...'
                : land
                  ? 'Update Land'
                  : 'Save Land'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default LandFormModal