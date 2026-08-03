import { useEffect, useState } from 'react'
import {
  BarChart3,
  BriefcaseBusiness,
  FileText,
  LoaderCircle,
  LockKeyhole,
  Map,
  Save,
  Sprout,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import type { PreferredLanguage } from '../types/auth'

type FeatureItem = {
  title: string
  description: string
  icon: typeof Map
}

function ProfileSetupPage() {
  const navigate = useNavigate()
  const { userAccount, completeProfile } = useAuth()

  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [country, setCountry] = useState('Pakistan')
  const [preferredLanguage, setPreferredLanguage] =
    useState<PreferredLanguage>('en')
  const [agricultureBusinessName, setAgricultureBusinessName] =
    useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userAccount) {
      return
    }

    setFullName(userAccount.fullName)
    setPhoneNumber(userAccount.phoneNumber)
    setCountry(userAccount.country || 'Pakistan')
    setPreferredLanguage(userAccount.preferredLanguage)
    setAgricultureBusinessName(
      userAccount.agricultureBusinessName,
    )
  }, [userAccount])

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setError('')

    if (!fullName.trim()) {
      setError('Your name is required.')
      return
    }

    if (!phoneNumber.trim()) {
      setError('Mobile number is required.')
      return
    }

    if (!country.trim()) {
      setError('Country is required.')
      return
    }

    try {
      setIsSubmitting(true)

      await completeProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        country: country.trim(),
        preferredLanguage,
        agricultureBusinessName:
          agricultureBusinessName.trim(),
      })

      navigate('/')
    } catch (submitError) {
      console.error(
        'Unable to complete profile:',
        submitError,
      )

      setError(
        'Unable to save your profile. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const featureItems: FeatureItem[] = [
    {
      title: 'Record Land',
      description:
        'Add and manage all your lands in acres.',
      icon: Map,
    },
    {
      title: 'Manage Farmers',
      description:
        'Keep farmer details and land assignments.',
      icon: Users,
    },
    {
      title: 'Track Crops',
      description:
        'Plan crops, record activities and monitor progress.',
      icon: Sprout,
    },
    {
      title: 'Expenses & Income',
      description:
        'Track expenses, sales and calculate profit easily.',
      icon: BarChart3,
    },
    {
      title: 'Reports',
      description:
        'Get clear reports for land, farmer, crop and date range.',
      icon: FileText,
    },
  ]

  return (
    <main className="min-h-screen bg-slate-100 p-3 sm:p-4">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-7xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl sm:min-h-[calc(100vh-2rem)] lg:grid-cols-[0.82fr_1.18fr]">
        {/* Left information panel */}
        <section className="hidden bg-emerald-950 px-8 py-7 text-white lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400 text-emerald-950">
              <Sprout className="h-7 w-7" />
            </div>

            <div>
              <p className="text-xl font-bold">
                Smart Agri Manager
              </p>

              <p className="text-sm text-emerald-200">
                Agriculture Management System
              </p>
            </div>
          </div>

          <div className="mt-9">
            <h1 className="max-w-md text-4xl font-bold leading-tight">
              Manage your{' '}
              <span className="text-emerald-400">
                agriculture business
              </span>
            </h1>

            <p className="mt-3 text-lg text-emerald-50">
              All your agriculture records in one place.
            </p>
          </div>

          <div className="mt-7 space-y-5">
            {featureItems.map((item) => {
              const Icon = item.icon

              return (
                <div
                  key={item.title}
                  className="flex items-start gap-4"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-emerald-300">
                    <Icon className="h-6 w-6" />
                  </div>

                  <div>
                    <p className="text-base font-bold">
                      {item.title}
                    </p>

                    <p className="mt-1 max-w-xs text-sm leading-5 text-emerald-100">
                      {item.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-auto border-t border-emerald-800 pt-5">
            <div className="flex items-center gap-3 text-sm text-emerald-300">
              <LockKeyhole className="h-5 w-5" />

              <span>
                Your data is safe and secure with us.
              </span>
            </div>
          </div>
        </section>

        {/* Profile form */}
        <section className="flex items-center justify-center px-5 py-6 sm:px-8 lg:px-12 lg:py-7">
          <div className="w-full max-w-2xl">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Sprout className="h-6 w-6" />
              </div>

              <div>
                <p className="font-bold text-slate-900">
                  Smart Agri Manager
                </p>

                <p className="text-sm text-slate-500">
                  Agriculture Management System
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-emerald-700">
                Welcome
              </p>

              <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Complete your profile
              </h2>

              <p className="mt-2 text-sm text-slate-500 sm:text-base">
                Add your details to get started with Smart Agri
                Manager.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {error}
                </div>
              )}

              <label className="block">
                <span className="text-sm font-bold text-slate-800">
                  Your Name *
                </span>

                <input
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">
                  Mobile Number *
                </span>

                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) =>
                    setPhoneNumber(event.target.value)
                  }
                  placeholder="Example: 0300 1234567"
                  autoComplete="tel"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">
                  Country *
                </span>

                <select
                  value={country}
                  onChange={(event) =>
                    setCountry(event.target.value)
                  }
                  autoComplete="country-name"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="Pakistan">Pakistan</option>
                  <option value="United Arab Emirates">
                    United Arab Emirates
                  </option>
                  <option value="Saudi Arabia">
                    Saudi Arabia
                  </option>
                  <option value="Qatar">Qatar</option>
                  <option value="Oman">Oman</option>
                  <option value="Bahrain">Bahrain</option>
                  <option value="Kuwait">Kuwait</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">
                  Preferred Language
                </span>

                <select
                  value={preferredLanguage}
                  onChange={(event) =>
                    setPreferredLanguage(
                      event.target.value as PreferredLanguage,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="en">English</option>
                  <option value="ur">Urdu</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-800">
                  Agriculture Business Name
                  <span className="ml-1 font-normal text-slate-400">
                    (Optional)
                  </span>
                </span>

                <div className="relative mt-2">
                  <BriefcaseBusiness className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />

                  <input
                    type="text"
                    value={agricultureBusinessName}
                    onChange={(event) =>
                      setAgricultureBusinessName(
                        event.target.value,
                      )
                    }
                    placeholder="Example: Nadeem Agriculture"
                    className="w-full rounded-xl border border-slate-300 py-3 pl-12 pr-4 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  This helps identify your overall agriculture
                  business.
                  <br />
                  You may leave it blank and change it later.
                </p>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3.5 text-base font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}

                {isSubmitting
                  ? 'Saving profile...'
                  : 'Save and Continue'}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  )
}

export default ProfileSetupPage