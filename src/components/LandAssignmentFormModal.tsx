import { useEffect, useMemo, useState } from 'react'
import {
  LoaderCircle,
  Save,
  X,
} from 'lucide-react'
import {
  calculateActiveAssignedAcres,
  calculateAvailableLandAcres,
  getLandAssignments,
} from '../services/landAssignmentService'
import type { Farmer } from '../types/farmer'
import type { Land } from '../types/land'
import type {
  CreateLandAssignmentInput,
  LandAssignment,
  LandAssignmentStatus,
} from '../types/landAssignment'

type LandAssignmentFormModalProps = {
  isOpen: boolean
  assignment?: LandAssignment | null
  organizationId?: string
  lands?: Land[]
  farmers?: Farmer[]
existingAssignments?: LandAssignment[]
  onClose: () => void
  onSubmit?: (
    input: CreateLandAssignmentInput,
  ) => Promise<void>
}

const getTodayDate = () =>
  new Date().toISOString().slice(0, 10)

const createInitialForm = (
  organizationId = '',
): CreateLandAssignmentInput => ({
  organizationId,
  landId: '',
  farmerId: '',
  assignedAcres: 0,
  startDate: getTodayDate(),
  endDate: '',
  status: 'active',
  notes: '',
})

function LandAssignmentFormModal({
  isOpen,
  assignment,
  organizationId = '',
  lands = [],
  farmers = [],
  existingAssignments,
  onClose,
  onSubmit,
}: LandAssignmentFormModalProps) {
  const [form, setForm] =
    useState<CreateLandAssignmentInput>(
      createInitialForm(organizationId),
    )
  const [assignments, setAssignments] = useState<
    LandAssignment[]
  >([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingAvailability, setIsLoadingAvailability] =
    useState(false)
  const [error, setError] = useState('')
  const [availabilityError, setAvailabilityError] =
    useState('')

  useEffect(() => {
    if (assignment) {
      setForm({
        organizationId:
          assignment.organizationId ||
          organizationId,
        landId: assignment.landId,
        farmerId: assignment.farmerId,
        assignedAcres: assignment.assignedAcres,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
        status: assignment.status,
        notes: assignment.notes,
      })
    } else {
      setForm(createInitialForm(organizationId))
    }

    setError('')
    setAvailabilityError('')
  }, [assignment, isOpen, organizationId])

  useEffect(() => {
      if (isOpen && existingAssignments) {
      setAssignments(existingAssignments)
      setIsLoadingAvailability(false)
      setAvailabilityError('')
      return
    }
    if (!isOpen || !form.organizationId) {
      setAssignments([])
      setIsLoadingAvailability(false)
      setAvailabilityError('')
      return
    }

    let isCurrent = true

    const loadAssignments = async () => {
      setIsLoadingAvailability(true)
      setAvailabilityError('')

      try {
        const currentAssignments =
          await getLandAssignments(
            form.organizationId,
          )

        if (isCurrent) {
          setAssignments(currentAssignments)
        }
      } catch (loadError) {
        console.error(
          'Unable to load land availability:',
          loadError,
        )

        if (isCurrent) {
          setAssignments([])
          setAvailabilityError(
            'Unable to calculate available acreage. Please try again.',
          )
        }
      } finally {
        if (isCurrent) {
          setIsLoadingAvailability(false)
        }
      }
    }

    void loadAssignments()

    return () => {
      isCurrent = false
    }
  }, [existingAssignments, form.organizationId, isOpen])

  const activeLands = useMemo(
    () =>
      lands.filter(
        (land) => land.status === 'active',
      ),
    [lands],
  )

  const activeFarmers = useMemo(
    () =>
      farmers.filter(
        (farmer) => farmer.status === 'active',
      ),
    [farmers],
  )

  const selectedLand = useMemo(
    () =>
      lands.find(
        (land) => land.id === form.landId,
      ) ?? null,
    [lands, form.landId],
  )

  const alreadyAssignedAcres = useMemo(() => {
    if (!selectedLand) {
      return 0
    }

    return calculateActiveAssignedAcres(
      assignments,
      selectedLand.id,
      assignment?.id,
    )
  }, [assignment?.id, assignments, selectedLand])

  const availableAcres = useMemo(() => {
    if (!selectedLand) {
      return 0
    }

    return calculateAvailableLandAcres(
      selectedLand.totalAcres,
      assignments,
      selectedLand.id,
      assignment?.id,
    )
  }, [assignment?.id, assignments, selectedLand])

  const updateField = <
    Key extends keyof CreateLandAssignmentInput,
  >(
    field: Key,
    value: CreateLandAssignmentInput[Key],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
    setError('')
  }
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setError('')

    if (!form.organizationId.trim()) {
      setError('Organization is required.')
      return
    }

    if (!form.landId) {
      setError('Please select a land.')
      return
    }

    if (!form.farmerId) {
      setError('Please select a farmer.')
      return
    }

    if (
      !Number.isFinite(form.assignedAcres) ||
      form.assignedAcres <= 0
    ) {
      setError(
        'Assigned acres must be greater than zero.',
      )
      return
    }

    if (isLoadingAvailability) {
      setError(
        'Please wait while available acreage is calculated.',
      )
      return
    }

    if (availabilityError) {
      setError(availabilityError)
      return
    }

    if (form.assignedAcres > availableAcres) {
      setError(
        `Only ${availableAcres.toLocaleString()} acres are available for assignment.`,
      )
      return
    }

    if (!form.startDate) {
      setError('Please select a start date.')
      return
    }

    if (
      form.endDate &&
      form.endDate < form.startDate
    ) {
      setError(
        'End date cannot be earlier than the start date.',
      )
      return
    }

    if (!onSubmit) {
      setError(
        'The assignment save handler is not configured.',
      )
      return
    }

    setIsSaving(true)

    try {
      await onSubmit({
        organizationId: form.organizationId.trim(),
        landId: form.landId,
        farmerId: form.farmerId,
        assignedAcres: Number(
          form.assignedAcres,
        ),
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
        notes: form.notes.trim(),
      })

      if (!assignment) {
        setForm(
          createInitialForm(form.organizationId),
        )
      }

      onClose()
    } catch (submitError) {
      console.error(
        'Unable to save land assignment:',
        submitError,
      )
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save the land assignment.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close land assignment form"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={isSaving ? undefined : onClose}
      />

      <section className="relative z-10 max-h-[96vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {assignment
                ? 'Edit Land Assignment'
                : 'Add Land Assignment'}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select a land and farmer, then enter
              the assigned area.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 px-6 py-4"
        >
          {(error || availabilityError) && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700">
              {error || availabilityError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Land *
              </span>

              <select
                value={form.landId}
                onChange={(event) =>
                  updateField(
                    'landId',
                    event.target.value,
                  )
                }
                disabled={isSaving}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100"
              >
                <option value="">
                  Select land
                </option>

                {activeLands.map((land) => (
                  <option
                    key={land.id}
                    value={land.id}
                  >
                    {land.landCode} — {land.landName}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Farmer *
              </span>

              <select
                value={form.farmerId}
                onChange={(event) =>
                  updateField(
                    'farmerId',
                    event.target.value,
                  )
                }
                disabled={isSaving}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-100"
              >
                <option value="">
                  Select farmer
                </option>

                {activeFarmers.map((farmer) => (
                  <option
                    key={farmer.id}
                    value={farmer.id}
                  >
                    {farmer.farmerCode} —{' '}
                    {farmer.farmerName}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {selectedLand && (
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total Land
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {selectedLand.totalAcres.toLocaleString()} Acres
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Already Assigned
                </p>
                <p className="mt-1 text-lg font-bold text-amber-700">
                  {isLoadingAvailability
                    ? 'Calculating...'
                    : `${alreadyAssignedAcres.toLocaleString()} Acres`}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Available
                </p>
                <p className="mt-1 text-lg font-bold text-emerald-700">
                  {isLoadingAvailability
                    ? 'Calculating...'
                    : `${availableAcres.toLocaleString()} Acres`}
                </p>
              </div>
            </div>
          )}

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Assigned Acres *
            </span>

            <input
              type="number"
              min="0.01"
              max={
                selectedLand
                  ? availableAcres
                  : undefined
              }
              step="0.01"
              value={form.assignedAcres || ''}
              onChange={(event) =>
                updateField(
                  'assignedAcres',
                  Number(event.target.value),
                )
              }
              placeholder="Enter assigned acres"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />

            {selectedLand &&
              !isLoadingAvailability &&
              form.assignedAcres >
                availableAcres && (
                <p className="mt-2 text-sm font-medium text-rose-600">
                  Only{' '}
                  {availableAcres.toLocaleString()}{' '}
                  acres are available for
                  assignment.
                </p>
              )}
          </label>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Start Date *
              </span>

              <input
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  updateField(
                    'startDate',
                    event.target.value,
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                End Date
                <span className="ml-1 font-normal text-slate-400">
                  {' '}
                  (Optional)
                </span>
              </span>

              <input
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(event) =>
                  updateField(
                    'endDate',
                    event.target.value,
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Status
            </span>

            <select
              value={form.status}
              onChange={(event) =>
                updateField(
                  'status',
                  event.target
                    .value as LandAssignmentStatus,
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="active">
                Active
              </option>
              <option value="closed">
                Closed
              </option>
            </select>
          </label>

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
              placeholder="Optional information about this assignment"
              className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-2 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
            />
          </label>

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
              disabled={
                isSaving ||
                isLoadingAvailability ||
                Boolean(availabilityError)
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <LoaderCircle className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}

              {isSaving
                ? 'Saving...'
                : assignment
                  ? 'Update Assignment'
                  : 'Save Assignment'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export default LandAssignmentFormModal