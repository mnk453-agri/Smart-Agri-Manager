import {
  Banknote,
  CircleDollarSign,
  HandCoins,
  Map,
  Sprout,
  Users,
} from 'lucide-react'
import DashboardCard from './DashboardCard'

const dashboardStats = [
  {
    title: 'Total Land Acres',
    value: '0 Acres',
    icon: Map,
    iconStyle: 'bg-emerald-100 text-emerald-700',
    path: '/lands',
    note: 'Owned and leased land',
  },
  {
    title: 'Total Farmers',
    value: '0',
    icon: Users,
    iconStyle: 'bg-sky-100 text-sky-700',
    path: '/farmers',
    note: 'Active farmer records',
  },
  {
    title: 'Active Crop Cycles',
    value: '0',
    icon: Sprout,
    iconStyle: 'bg-lime-100 text-lime-700',
    path: '/crops',
    note: 'Currently active crops',
  },
  {
    title: 'Total Expenses',
    value: 'PKR 0',
    icon: CircleDollarSign,
    iconStyle: 'bg-rose-100 text-rose-700',
    path: '/general-expenses',
    note: 'Recorded crop and general expenses',
  },
  {
    title: 'Total Sales',
    value: 'PKR 0',
    icon: Banknote,
    iconStyle: 'bg-violet-100 text-violet-700',
    path: '/harvest-sales',
    note: 'Recorded harvest and crop sales',
  },
  {
    title: 'Net Profit/Loss',
    value: 'PKR 0',
    icon: HandCoins,
    iconStyle: 'bg-amber-100 text-amber-700',
    path: '/profit-loss',
    note: 'Calculated after expenses and settlements',
    valueStyle: 'text-slate-900',
  },
]

function DashboardStats() {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900">
          Farm Overview
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Live values will appear here after farm records are added.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {dashboardStats.map((stat) => (
          <DashboardCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconStyle={stat.iconStyle}
            path={stat.path}
            note={stat.note}
            valueStyle={stat.valueStyle}
          />
        ))}
      </div>
    </section>
  )
}

export default DashboardStats