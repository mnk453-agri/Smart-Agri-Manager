import { useEffect, useState } from 'react'
import { LoaderCircle, Save, X } from 'lucide-react'
import type { Farmer } from '../types/farmer'
import type { Land } from '../types/land'
import type {
  CreateCropInput,
  Crop,
  CropSeason,
  CropShareType,
  CropStatus,
} from '../types/crop'

type CropFormModalProps = {
  isOpen: boolean
  crop?: Crop | null
  lands: Land[]
  farmers: Farmer[]
  onClose: () => void
  onSubmit: (input: CreateCropInput) => Promise<void>
}

const initialForm: CreateCropInput = {
  cropName: '',
  landId: '',
  farmerId: '',
  areaAcres: 0,
  sowingDate: '',
  expectedHarvestDate: '',
  actualHarvestDate: '',
  season: 'kharif',
  shareType: 'shared_with_farmer',
  status: 'planned',
  notes: '',
}

function CropFormModal({
  isOpen,
  crop,
  lands,
  farmers,
  onClose,
  onSubmit,
}: CropFormModalProps) {
  const [form, setForm] = useState<CreateCropInput>(initialForm)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (crop) {
      setForm({
        cropName: crop.cropName,
        landId: crop.landId,
        farmerId: crop.farmerId,
        areaAcres: crop.areaAcres,
        sowingDate: crop.sowingDate,
        expectedHarvestDate: crop.expectedHarvestDate,
        actualHarvestDate: crop.actualHarvestDate,
        season: crop.season,
        shareType: crop.shareType,
        status: crop.status,
        notes: crop.notes,
      })
    } else {
      setForm(initialForm)
    }

    setError('')
  }, [crop, isOpen])

  if (!isOpen) {
    return null
  }

  const updateField = <K extends keyof CreateCropInput>(
    field: K,
    value: CreateCropInput[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleShareTypeChange = (value: CropShareType) => {
    setForm((current) => ({
      ...current,
      shareType: value,
      farmerId:
        value === 'owner_only'
          ? ''
          : current.farmerId,
    }))
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setError('')

    if (!form.cropName.trim()) {
      setError('Crop name is required.')
      return
    }

    if (!form.landId) {
      setError('Please select a land.')
      return
    }

    if (
      form.shareType === 'shared_with_farmer' &&
      !form.farmerId
    ) {
      setError('Please select a farmer for the shared crop.')
      return
    }

    if (form.areaAcres <= 0) {
      setError('Crop area must be greater than zero.')
      return
    }

    if (!form.sowingDate) {
      setError('Sowing date is required.')
      return
    }

    const selectedLand = lands.find(
      (land) => land.id === form.landId,
    )

    if (
      selectedLand &&
      form.areaAcres > selectedLand.totalAcres
    ) {
      setError(
        `Crop area cannot exceed ${selectedLand.totalAcres} acres for the selected land.`,
      )
      return
    }

    try {
      setIsSaving(true)

      await onSubmit({
        ...form,
        cropName: form.cropName.trim(),
        farmerId:
          form.shareType === 'owner_only'
            ? ''
            : form.farmerId,
        notes: form.notes.trim(),
      })

      onClose()
    } catch (submitError) {
      console.error(submitError)
      setError('Unable to save the crop record. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close crop form"
        className="absolute inset-0 bg-slate-950/50"
        onClick={onClose}
      />

      <section className="relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {crop ? 'Edit Crop Cycle' : 'Start New Crop Cycle'}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Connect the crop with its land, farmer, area, and dates.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
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

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label>
              <span className="text-sm font-semibold text-slate-700">
                Crop Name *
              </span>

              <input
                type="text"
                value={form.cropName}
                onChange={(event) =>
                  updateField('cropName', event.target.value)
                }
                placeholder="Example: Cotton"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Season
              </span>

              <select
                value={form.season}
                onChange={(event) =>
                  updateField(
                    'season',
                    event.target.value as CropSeason,
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="kharif">Kharif</option>
                <option value="rabi">Rabi</option>
                <option value="perennial">Perennial</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Land *
              </span>

              <select
                value={form.landId}
                onChange={(event) =>
                  updateField('landId', event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">Select land</option>

                {lands.map((land) => (
                  <option key={land.id} value={land.id}>
                    {land.landName} — {land.totalAcres} acres
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Crop Area (Acres) *
              </span>

              <input
                type="number"
                min="0"
                step="0.01"
                value={form.areaAcres || ''}
                onChange={(event) =>
                  updateField(
                    'areaAcres',
                    Number(event.target.value),
                  )
                }
                placeholder="0"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Share Type *
              </span>

              <select
                value={form.shareType}
                onChange={(event) =>
                  handleShareTypeChange(
                    event.target.value as CropShareType,
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="shared_with_farmer">
                  Shared with Farmer
                </option>
                <option value="owner_only">Owner Only</option>
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Farmer
              </span>

              <select
                value={form.farmerId}
                disabled={form.shareType === 'owner_only'}
                onChange={(event) =>
                  updateField('farmerId', event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="">
                  {form.shareType === 'owner_only'
                    ? 'Not applicable'
                    : 'Select farmer'}
                </option>

                {farmers
                  .filter((farmer) => farmer.status === 'active')
                  .map((farmer) => (
                    <option key={farmer.id} value={farmer.id}>
                      {farmer.farmerName}
                      {farmer.casteName
                        ? ` — ${farmer.casteName}`
                        : ''}
                    </option>
                  ))}
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Sowing Date *
              </span>

              <input
                type="date"
                value={form.sowingDate}
                onChange={(event) =>
                  updateField('sowingDate', event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Expected Harvest Date
              </span>

              <input
                type="date"
                value={form.expectedHarvestDate}
                onChange={(event) =>
                  updateField(
                    'expectedHarvestDate',
                    event.target.value,
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Status
              </span>

              <select
                value={form.status}
                onChange={(event) =>
                  updateField(
                    'status',
                    event.target.value as CropStatus,
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="harvested">Harvested</option>
                <option value="closed">Closed</option>
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold text-slate-700">
                Actual Harvest Date
              </span>

              <input
                type="date"
                value={form.actualHarvestDate}
                disabled={
                  form.status !== 'harvested' &&
                  form.status !== 'closed'
                }
                onChange={(event) =>
                  updateField(
                    'actualHarvestDate',
                    event.target.value,
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
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
              placeholder="Optional crop-cycle information"
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}

              {isSaving
                ? 'Saving...'
                : crop
                  ? 'Update Crop'
                  : 'Save Crop'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default CropFormModal