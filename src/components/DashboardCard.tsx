type DashboardCardProps = {
  title: string
  value: string
  color?: string
}

export default function DashboardCard({
  title,
  value,
  color = "bg-green-600",
}: DashboardCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>

          <h2 className="text-3xl font-bold mt-2">
            {value}
          </h2>
        </div>

        <div
          className={`w-12 h-12 rounded-lg ${color}`}
        ></div>
      </div>
    </div>
  )
}