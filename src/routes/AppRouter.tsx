import { Route, Routes } from "react-router";
import DashboardLayout from "../layouts/DashboardLayout";
import HomePage from "../pages/HomePage";

function AppRouter() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<HomePage />} />
      </Route>
    </Routes>
  );
}

export default AppRouter;