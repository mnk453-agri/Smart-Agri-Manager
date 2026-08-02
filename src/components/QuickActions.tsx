import {
  CircleDollarSign,
  MapPlus,
  ShoppingCart,
  Sprout,
  UserPlus,
  Wheat,
} from 'lucide-react'
import { Link } from 'react-router'

const quickActions = [
  {
    label: 'Add Land',
    description: 'Register owned or leased land',
    path: '/lands/new',
    icon: MapPlus,
    style: 'bg-emerald-100 text-emerald-700',
  },
  {
    label: 'Add Farmer',
    description: 'Create a new farmer record',
    path: '/farmers/new',
    icon: UserPlus,
    style: 'bg-sky-100 text-sky-700',
  },
  {
    label: 'Start Crop Cycle',
    description: 'Assign a crop to land and farmer',
    path: '/crops/new',
    icon: Sprout,
    style: 'bg-lime-100 text-lime-700',
  },
  {
    label: 'Record Purchase',
    description: 'Enter fertilizer, seed or other items',
    path: '/purchases/new',
    icon: ShoppingCart,
    style: 'bg-violet-100 text-violet-700',
  },
  {
    label: 'Add Expense',
    description: 'Record a general or crop expense',
    path: '/general-expenses/new',
    icon: CircleDollarSign,
    style: 'bg-rose-100 text-rose-700',
  },
  {
    label: 'Record Harvest or Sale',
    description: 'Enter crop production and sale details',
    path: '/harvest-sales/new',
    icon: Wheat,
    style: 'bg-amber-100 text-amber-700',
  },
]

function QuickActions() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Quick Actions
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Open frequently used forms directly from the dashboard.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {quickActions.map((action) => {
          const Icon = action.icon

          return (
            <Link
              key={action.label}
              to={action.path}
              className="group flex items-center gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-300 hover:bg-emerald-50/50"
            >
              <div
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${action.style}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-slate-900 group-hover:text-emerald-800">
                  {action.label}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {action.description}
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export default QuickActions