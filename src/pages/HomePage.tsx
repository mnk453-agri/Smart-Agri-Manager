import DashboardCard from "../components/DashboardCard";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Dashboard
        </h1>

        <p className="text-gray-500 mt-1">
          Welcome to Smart Agri Manager
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <DashboardCard
          title="Total Lands"
          value="100 Acres"
        />

        <DashboardCard
          title="Farmers"
          value="10"
          color="bg-blue-600"
        />

        <DashboardCard
          title="Active Crops"
          value="6"
          color="bg-yellow-500"
        />

        <DashboardCard
          title="Monthly Expenses"
          value="PKR 520,000"
          color="bg-red-500"
        />

        <DashboardCard
          title="Monthly Sales"
          value="PKR 860,000"
          color="bg-emerald-600"
        />

        <DashboardCard
          title="Net Profit"
          value="PKR 340,000"
          color="bg-purple-600"
        />
      </div>
    </div>
  );
}