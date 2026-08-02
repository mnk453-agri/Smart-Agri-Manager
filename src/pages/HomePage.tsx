import DashboardStats from '../components/DashboardStats'
import QuickActions from '../components/QuickActions'
import RecentActivities from '../components/RecentActivities'

function HomePage() {
  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold text-emerald-700">
          Overview
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>

        <p className="mt-2 text-slate-500">
          Review farm activity, financial balances, and setup progress.
        </p>
      </section>

      <DashboardStats />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <QuickActions />
        <RecentActivities />
      </div>
    </div>
  )
}

export default HomePage