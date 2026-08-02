import { Route, Routes } from 'react-router'
import DashboardLayout from '../layouts/DashboardLayout'
import HomePage from '../pages/HomePage'
import LandsPage from '../pages/LandsPage'
import FarmersPage from '../pages/FarmersPage'

function AppRouter() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/lands" element={<LandsPage />} />
        <Route path="/farmers" element={<FarmersPage />} />
      </Route>
    </Routes>
  )
}

export default AppRouter