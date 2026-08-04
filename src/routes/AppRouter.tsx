import { Navigate, Route, Routes } from 'react-router'
import DashboardLayout from '../layouts/DashboardLayout'
import CreateWorkspacePage from '../pages/CreateWorkspacePage'
import FarmersPage from '../pages/FarmersPage'
import HomePage from '../pages/HomePage'
import LandsPage from '../pages/LandsPage'
import LandAssignmentsPage from '../pages/LandAssignmentsPage'
import LoginPage from '../pages/LoginPage'
import ProfileSetupPage from '../pages/ProfileSetupPage'
import RegisterPage from '../pages/RegisterPage'

function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/complete-profile"
        element={<ProfileSetupPage />}
      />
      <Route
        path="/create-workspace"
        element={<CreateWorkspacePage />}
      />

      <Route element={<DashboardLayout />}>
  <Route path="/" element={<HomePage />} />
  <Route path="/lands" element={<LandsPage />} />
  <Route
    path="/land-assignments"
    element={<LandAssignmentsPage />}
  />
  <Route path="/farmers" element={<FarmersPage />} />
</Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRouter