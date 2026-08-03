import { useState } from 'react'
import {
  Building2,
  LoaderCircle,
  Sprout,
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import type { PreferredLanguage } from '../types/auth'

function CreateWorkspacePage() {
  const navigate = useNavigate()
  const { createWorkspace, userAccount } = useAuth()

  const [organizationName, setOrganizationName] = useState('')
  const [defaultLanguage, setDefaultLanguage] =
    useState<PreferredLanguage>(
      userAccount?.preferredLanguage ?? 'en',
    )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setError('')

    if (!organizationName.trim()) {
      setError('Workspace name is required.')
      return
    }

    try {
      setIsSubmitting(true)

      await createWorkspace({
        organizationName: organizationName.trim(),
        defaultLanguage,
      })

      navigate('/')
    } catch (submitError) {
      console.error(submitError)
      setError(
        'Unable to create the workspace. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl lg:grid-cols-2">
        <section className="hidden bg-emerald-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400 text-emerald-950">
                <Sprout className="h-7 w-7" />
              </div>

              <div>
                <p className="text-xl font-bold">
                  Smart Agri Manager
                </p>
                <p className="text-sm text-emerald-200">
                  Farm Management System
                </p>
              </div>
            </div>

            <div className="mt-16 max-w-md">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">
                Step 2 of 2
              </p>

              <h1 className="mt-4 text-4xl font-bold leading-tight">
                Create your first farm workspace.
              </h1>

              <p className="mt-5 leading-7 text-emerald-100">
                A workspace keeps lands, farmers, crops, purchases,
                sales, users, and reports together under one secure
                access boundary.
              </p>
            </div>
          </div>

          <p className="text-sm text-emerald-300">
            You can create additional independent workspaces later.
          </p>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md">
            <div className="lg:hidden">
              <div className="inline-flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Building2 className="h-6 w-6" />
                </div>

                <div>
                  <p className="font-bold text-slate-900">
                    Create Farm Workspace
                  </p>
                  <p className="text-sm text-slate-500">
                    Step 2 of 2
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <p className="text-sm font-semibold text-emerald-700">
                Workspace setup
              </p>

              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                Name your farm workspace
              </h2>

              <p className="mt-3 text-slate-500">
                This name identifies the independent farm operation
                you are managing.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {error}
                </div>
              )}

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Workspace Name *
                </span>

                <input
                  type="text"
                  value={organizationName}
                  onChange={(event) =>
                    setOrganizationName(event.target.value)
                  }
                  placeholder="Example: DM Agriculture"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Default Language
                </span>

                <select
                  value={defaultLanguage}
                  onChange={(event) =>
                    setDefaultLanguage(
                      event.target.value as PreferredLanguage,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="en">English</option>
                  <option value="ur">Urdu</option>
                </select>
              </label>

              <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Currency
                  </p>
                  <p className="mt-1 font-bold text-slate-900">
                    PKR
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Land Unit
                  </p>
                  <p className="mt-1 font-bold text-slate-900">
                    Acres
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <Building2 className="h-5 w-5" />
                )}

                {isSubmitting
                  ? 'Creating workspace...'
                  : 'Create Workspace'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}

export default CreateWorkspacePage