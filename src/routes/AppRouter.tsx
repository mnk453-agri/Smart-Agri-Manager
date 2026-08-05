import {
  Navigate,
  Route,
  Routes,
} from 'react-router'
import DashboardLayout from '../layouts/DashboardLayout'
import CreateWorkspacePage from '../pages/CreateWorkspacePage'
import CropsPage from '../pages/CropsPage'
import FarmerDetailsPage from '../pages/FarmerDetailsPage'
import FarmersPage from '../pages/FarmersPage'
import HomePage from '../pages/HomePage'
import LandAssignmentsPage from '../pages/LandAssignmentsPage'
import LandsPage from '../pages/LandsPage'
import LoginPage from '../pages/LoginPage'
import ProfileSetupPage from '../pages/ProfileSetupPage'
import RegisterPage from '../pages/RegisterPage'

function AppRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />
      <Route
        path="/register"
        element={<RegisterPage />}
      />
      <Route
        path="/complete-profile"
        element={<ProfileSetupPage />}
      />
      <Route
        path="/create-workspace"
        element={<CreateWorkspacePage />}
      />

      <Route element={<DashboardLayout />}>
        <Route
          path="/"
          element={<HomePage />}
        />
        <Route
          path="/lands"
          element={<LandsPage />}
        />
        <Route
          path="/land-assignments"
          element={<LandAssignmentsPage />}
        />
        <Route
          path="/farmers"
          element={<FarmersPage />}
        />
        <Route
          path="/farmers/:farmerId"
          element={<FarmerDetailsPage />}
        />
        <Route
          path="/crops"
          element={<CropsPage />}
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  )
}

export default AppRouter