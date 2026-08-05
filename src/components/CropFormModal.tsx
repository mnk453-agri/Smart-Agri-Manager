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
import type { Farmer } from '../types/farmer'
import type { Land } from '../types/land'
import type { LandAssignment } from '../types/landAssignment'
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
  organizationId?: string
  assignments?: LandAssignment[]
  lands?: Land[]
  farmers?: Farmer[]
  existingCrops?: Crop[]
  onClose: () => void
  onSubmit: (
    input: CreateCropInput,
  ) => Promise<void>
}

const getTodayDate = () =>
  new Date().toISOString().slice(0, 10)

const createInitialForm = (
  organizationId = '',
): CreateCropInput => ({
  organizationId,
  cropName: '',
  season: 'kharif',
  status: 'planned',
  landAssignmentId: '',
  landId: '',
  farmerId: '',
  areaAcres: 0,
  landOwnershipType: 'owned',
  cropShareType: 'shared',
  ownerSharePercentage: 50,
  farmerSharePercentage: 50,
  sowingDate: getTodayDate(),
  expectedHarvestDate: '',
  actualHarvestDate: '',
  notes: '',
})

function CropFormModal({
  isOpen,
  crop,
  organizationId = '',
  assignments = [],
  lands = [],
  farmers = [],
  existingCrops = [],
  onClose,
  onSubmit,
}: CropFormModalProps) {
  const [form, setForm] =
    useState<CreateCropInput>(
      createInitialForm(organizationId),
    )
  const [isSaving, setIsSaving] =
    useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (crop) {
      setForm({
        organizationId:
          crop.organizationId ||
          organizationId,
        cropName: crop.cropName,
        season: crop.season,
        status: crop.status,
        landAssignmentId:
          crop.landAssignmentId,
        landId: crop.landId,
        farmerId: crop.farmerId,
        areaAcres: crop.areaAcres,
        landOwnershipType:
          crop.landOwnershipType,
        cropShareType:
          crop.cropShareType,
        ownerSharePercentage:
          crop.ownerSharePercentage,
        farmerSharePercentage:
          crop.farmerSharePercentage,
        sowingDate: crop.sowingDate,
        expectedHarvestDate:
          crop.expectedHarvestDate,
        actualHarvestDate:
          crop.actualHarvestDate,
        notes: crop.notes,
      })
    } else {
      setForm(
        createInitialForm(organizationId),
      )
    }

    setError('')
  }, [crop, isOpen, organizationId])

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

  const activeAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) =>
          assignment.status === 'active',
      ),
    [assignments],
  )

  const selectedAssignment = useMemo(
    () =>
      assignments.find(
        (assignment) =>
          assignment.id ===
          form.landAssignmentId,
      ) ?? null,
    [assignments, form.landAssignmentId],
  )

  const selectedLand = useMemo(
    () =>
      selectedAssignment
        ? landById.get(
            selectedAssignment.landId,
          ) ?? null
        : null,
    [landById, selectedAssignment],
  )

  const selectedFarmer = useMemo(
    () =>
      selectedAssignment
        ? farmerById.get(
            selectedAssignment.farmerId,
          ) ?? null
        : null,
    [farmerById, selectedAssignment],
  )

  const alreadyAllocatedAcres =
    useMemo(
      () => {
        if (!selectedAssignment) {
          return 0
        }

        return existingCrops
          .filter(
            (existingCrop) =>
              existingCrop.landAssignmentId ===
                selectedAssignment.id &&
              existingCrop.id !== crop?.id &&
              (existingCrop.status ===
                'planned' ||
                existingCrop.status ===
                  'active'),
          )
          .reduce(
            (total, existingCrop) =>
              total +
              existingCrop.areaAcres,
            0,
          )
      },
      [
        crop?.id,
        existingCrops,
        selectedAssignment,
      ],
    )

  const availableCropAcres = useMemo(
    () =>
      selectedAssignment
        ? Math.max(
            selectedAssignment.assignedAcres -
              alreadyAllocatedAcres,
            0,
          )
        : 0,
    [
      alreadyAllocatedAcres,
      selectedAssignment,
    ],
  )

  const updateField = <
    Key extends keyof CreateCropInput,
  >(
    field: Key,
    value: CreateCropInput[Key],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
    setError('')
  }

  const handleAssignmentChange = (
    assignmentId: string,
  ) => {
    const assignment =
      assignments.find(
        (item) =>
          item.id === assignmentId,
      ) ?? null

    const land = assignment
      ? landById.get(assignment.landId)
      : null

    setForm((current) => ({
      ...current,
      landAssignmentId: assignmentId,
      landId: assignment?.landId ?? '',
      farmerId:
        assignment?.farmerId ?? '',
      landOwnershipType:
        land?.ownership ?? 'owned',
      areaAcres: 0,
    }))
    setError('')
  }

  const handleShareTypeChange = (
    shareType: CropShareType,
  ) => {
    setForm((current) => ({
      ...current,
      cropShareType: shareType,
      ownerSharePercentage:
        shareType === 'owner_only'
          ? 100
          : 50,
      farmerSharePercentage:
        shareType === 'owner_only'
          ? 0
          : 50,
    }))
    setError('')
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

    if (!selectedAssignment) {
      setError(
        'Please select a land assignment.',
      )
      return
    }

    if (!selectedLand) {
      setError(
        'The land connected to this assignment could not be found.',
      )
      return
    }

    if (!selectedFarmer) {
      setError(
        'The farmer connected to this assignment could not be found.',
      )
      return
    }

    if (
      !Number.isFinite(form.areaAcres) ||
      form.areaAcres <= 0
    ) {
      setError(
        'Crop area must be greater than zero.',
      )
      return
    }

    if (
      form.areaAcres >
      availableCropAcres
    ) {
      setError(
        `Only ${availableCropAcres.toLocaleString()} acres are available for a new crop on this assignment.`,
      )
      return
    }

    if (!form.sowingDate) {
      setError(
        'Please select a sowing date.',
      )
      return
    }

    if (
      form.expectedHarvestDate &&
      form.expectedHarvestDate <
        form.sowingDate
    ) {
      setError(
        'Expected harvest date cannot be earlier than the sowing date.',
      )
      return
    }

    if (
      form.actualHarvestDate &&
      form.actualHarvestDate <
        form.sowingDate
    ) {
      setError(
        'Actual harvest date cannot be earlier than the sowing date.',
      )
      return
    }

    if (
      (form.status === 'harvested' ||
        form.status === 'closed') &&
      !form.actualHarvestDate
    ) {
      setError(
        'Actual harvest date is required for a harvested or closed crop.',
      )
      return
    }

    if (
      form.cropShareType === 'shared'
    ) {
      if (
        form.ownerSharePercentage <= 0 ||
        form.farmerSharePercentage <= 0
      ) {
        setError(
          'Owner and farmer shares must both be greater than zero.',
        )
        return
      }

      if (
        form.ownerSharePercentage +
          form.farmerSharePercentage !==
        100
      ) {
        setError(
          'Owner and farmer shares must total 100%.',
        )
        return
      }
    }

    setIsSaving(true)

    try {
      await onSubmit({
        ...form,
        organizationId:
          form.organizationId.trim(),
        cropName: form.cropName.trim(),
        landAssignmentId:
          selectedAssignment.id,
        landId: selectedAssignment.landId,
        farmerId:
          selectedAssignment.farmerId,
        landOwnershipType:
          selectedLand.ownership,
        ownerSharePercentage:
          form.cropShareType ===
          'owner_only'
            ? 100
            : Number(
                form.ownerSharePercentage,
              ),
        farmerSharePercentage:
          form.cropShareType ===
          'owner_only'
            ? 0
            : Number(
                form.farmerSharePercentage,
              ),
        notes: form.notes.trim(),
      })

      onClose()
    } catch (submitError) {
      console.error(
        'Unable to save crop:',
        submitError,
      )
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save the crop record.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2">
      <button
        type="button"
        aria-label="Close crop form"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={isSaving ? undefined : onClose}
      />

      <section className="relative z-10 max-h-[98vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {crop
                ? 'Edit Crop Cycle'
                : 'Start New Crop Cycle'}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Connect the crop to an active land assignment and define its sharing arrangement.
            </p>
          </div>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-2 px-6 py-3"
        >
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Crop Name *
              </span>

              <input
                type="text"
                value={form.cropName}
                onChange={(event) =>
                  updateField(
                    'cropName',
                    event.target.value,
                  )
                }
                placeholder="Example: Cotton"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Season *
              </span>

              <select
                value={form.season}
                onChange={(event) =>
                  updateField(
                    'season',
                    event.target
                      .value as CropSeason,
                  )
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="kharif">
                  Kharif
                </option>
                <option value="rabi">
                  Rabi
                </option>
                <option value="perennial">
                  Perennial
                </option>
                <option value="other">
                  Other
                </option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Status *
              </span>

              <select
                value={form.status}
                onChange={(event) =>
                  updateField(
                    'status',
                    event.target
                      .value as CropStatus,
                  )
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="planned">
                  Planned
                </option>
                <option value="active">
                  Active
                </option>
                <option value="harvested">
                  Harvested
                </option>
                <option value="closed">
                  Closed
                </option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block sm:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Land Assignment *
              </span>

              <select
                value={
                  form.landAssignmentId
                }
                onChange={(event) =>
                  handleAssignmentChange(
                    event.target.value,
                  )
                }
                disabled={isSaving}
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100"
              >
                <option value="">
                  Select an active assignment
                </option>

                {activeAssignments.map(
                  (assignment) => {
                    const land =
                      landById.get(
                        assignment.landId,
                      )
                    const farmer =
                      farmerById.get(
                        assignment.farmerId,
                      )

                    return (
                      <option
                        key={assignment.id}
                        value={assignment.id}
                      >
                        {land?.landCode ??
                          'LAND-000'}{' '}
                        —{' '}
                        {land?.landName ??
                          'Unknown Land'}{' '}
                        —{' '}
                        {farmer?.farmerCode ??
                          'FARMER-000'}{' '}
                        —{' '}
                        {farmer?.farmerName ??
                          'Unknown Farmer'}
                      </option>
                    )
                  },
                )}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Crop Area (Acres) *
              </span>

              <input
                type="number"
                min="0.01"
                max={
                  selectedAssignment
                    ? availableCropAcres
                    : undefined
                }
                step="0.01"
                value={form.areaAcres || ''}
                onChange={(event) =>
                  updateField(
                    'areaAcres',
                    Number(
                      event.target.value,
                    ),
                  )
                }
                placeholder="Enter crop acres"
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          {selectedAssignment && (
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-5">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Land
                </p>
                <p className="mt-1 font-bold text-slate-900">
                  {selectedLand?.landName ??
                    'Unknown'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Farmer
                </p>
                <p className="mt-1 font-bold text-slate-900">
                  {selectedFarmer?.farmerName ??
                    'Unknown'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Ownership
                </p>
                <p className="mt-1 font-bold capitalize text-slate-900">
                  {selectedLand?.ownership ??
                    'owned'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Assigned
                </p>
                <p className="mt-1 font-bold text-amber-700">
                  {selectedAssignment.assignedAcres.toLocaleString()}{' '}
                  Acres
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Available
                </p>
                <p className="mt-1 font-bold text-emerald-700">
                  {availableCropAcres.toLocaleString()}{' '}
                  Acres
                </p>
              </div>
            </div>
          )}
          {selectedAssignment &&
            form.areaAcres >
              availableCropAcres && (
              <p className="text-sm font-medium text-rose-600">
                Only{' '}
                {availableCropAcres.toLocaleString()}{' '}
                acres are available for this crop.
              </p>
            )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Crop Share Type *
              </span>

              <select
                value={form.cropShareType}
                onChange={(event) =>
                  handleShareTypeChange(
                    event.target
                      .value as CropShareType,
                  )
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              >
                <option value="shared">
                  Shared
                </option>
                <option value="owner_only">
                  Owner Only
                </option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Owner Share %
              </span>

              <input
                type="number"
                min={
                  form.cropShareType ===
                  'shared'
                    ? 1
                    : 100
                }
                max="100"
                step="1"
                value={
                  form.ownerSharePercentage
                }
                disabled={
                  form.cropShareType ===
                  'owner_only'
                }
                onFocus={(event) =>
  event.currentTarget.select()
}
                onChange={(event) => {
                  const ownerShare =
                    Number(
                      event.target.value,
                    )

                  setForm((current) => ({
                    ...current,
                    ownerSharePercentage:
                      ownerShare,
                    farmerSharePercentage:
                      Math.max(
                        100 - ownerShare,
                        0,
                      ),
                  }))
                  setError('')
                }}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2 outline-none transition disabled:bg-slate-100 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Farmer Share %
              </span>

              <input
                type="number"
                value={
                  form.farmerSharePercentage
                }
                readOnly
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-100 px-4 py-2 text-slate-700 outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Sowing Date *
              </span>

              <input
                type="date"
                value={form.sowingDate}
                onChange={(event) =>
                  updateField(
                    'sowingDate',
                    event.target.value,
                  )
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Expected Harvest Date
              </span>

              <input
                type="date"
                value={
                  form.expectedHarvestDate
                }
                min={form.sowingDate}
                onChange={(event) =>
                  updateField(
                    'expectedHarvestDate',
                    event.target.value,
                  )
                }
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Actual Harvest Date
              </span>

              <input
                type="date"
                value={
                  form.actualHarvestDate
                }
                min={form.sowingDate}
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
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-4 py-2 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Notes
            </span>

            <textarea
              rows={1}
              value={form.notes}
              onChange={(event) =>
                updateField(
                  'notes',
                  event.target.value,
                )
              }
              placeholder="Optional crop-cycle information"
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-300 px-4 py-2 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

          {selectedLand?.ownership ===
            'leased' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
              This is leased land. Its annual lease
              amount will be recorded and allocated
              separately as an expense; it does not
              change the crop share type.
            </div>
          )}

          <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
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