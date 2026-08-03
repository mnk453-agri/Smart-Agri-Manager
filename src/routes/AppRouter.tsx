import { Navigate, Route, Routes } from 'react-router'
import DashboardLayout from '../layouts/DashboardLayout'

import HomePage from '../pages/HomePage'
import LandsPage from '../pages/LandsPage'
import FarmersPage from '../pages/FarmersPage'

import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import CreateWorkspacePage from '../pages/CreateWorkspacePage'

function AppRouter() {
  return (
    <Routes>
      {/* Authentication */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/create-workspace"
        element={<CreateWorkspacePage />}
      />

      {/* Dashboard */}
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/lands" element={<LandsPage />} />
        <Route path="/farmers" element={<FarmersPage />} />
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRouter