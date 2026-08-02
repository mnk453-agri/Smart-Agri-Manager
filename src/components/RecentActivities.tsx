import {
  CircleDollarSign,
  Clock3,
  ShoppingCart,
  Sprout,
  UserPlus,
} from 'lucide-react'

const recentActivities = [
  {
    title: 'No activities recorded yet',
    description:
      'Recent land, farmer, crop, purchase, expense, and sale entries will appear here.',
    time: 'Waiting for first record',
    icon: Clock3,
    style: 'bg-slate-100 text-slate-600',
  },
]

const activityLegend = [
  {
    label: 'Farmer',
    icon: UserPlus,
    style: 'text-sky-600',
  },
  {
    label: 'Crop',
    icon: Sprout,
    style: 'text-lime-600',
  },
  {
    label: 'Purchase',
    icon: ShoppingCart,
    style: 'text-violet-600',
  },
  {
    label: 'Expense',
    icon: CircleDollarSign,
    style: 'text-rose-600',
  },
]

function RecentActivities() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Recent Activities
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Latest farm and financial entries will appear automatically.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {recentActivities.map((activity) => {
          const Icon = activity.icon

          return (
            <div
              key={activity.title}
              className="flex gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4"
            >
              <div
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${activity.style}`}
              >
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-slate-900">
                  {activity.title}
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {activity.description}
                </p>

                <p className="mt-2 text-xs font-medium text-slate-400">
                  {activity.time}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4">
        {activityLegend.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.label}
              className="flex items-center gap-2 text-xs font-medium text-slate-500"
            >
              <Icon className={`h-4 w-4 ${item.style}`} />
              <span>{item.label}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default RecentActivities