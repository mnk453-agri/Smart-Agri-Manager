import type { ComponentType } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'

type DashboardCardProps = {
  title: string
  value: string
  icon: ComponentType<{ className?: string }>
  iconStyle?: string
  path?: string
  note?: string
  valueStyle?: string
}

function DashboardCard({
  title,
  value,
  icon: Icon,
  iconStyle = 'bg-emerald-100 text-emerald-700',
  path,
  note,
  valueStyle = 'text-slate-900',
}: DashboardCardProps) {
  const content = (
    <div className="group h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className={`grid h-12 w-12 place-items-center rounded-xl ${iconStyle}`}>
          <Icon className="h-6 w-6" />
        </div>

        {path && (
          <ArrowUpRight className="h-5 w-5 text-slate-300 transition group-hover:text-emerald-600" />
        )}
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-slate-500">{title}</p>

        <p className={`mt-2 text-2xl font-bold tracking-tight ${valueStyle}`}>
          {value}
        </p>

        {note && (
          <p className="mt-2 text-xs leading-5 text-slate-400">
            {note}
          </p>
        )}
      </div>
    </div>
  )

  if (path) {
    return (
      <Link to={path} className="block h-full">
        {content}
      </Link>
    )
  }

  return content
}

export default DashboardCard