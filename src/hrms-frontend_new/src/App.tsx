import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom'

import Login from './pages/login'
import Dashboard from './pages/Dashboard'
import { RolesPage } from './pages/Roles'
import { UsersPage } from './pages/Users'
import { MyApplicationsPage } from './pages/MyApplications'
import { MyLeavesPage } from './pages/MyLeaves'
import { CompanyPage } from './pages/Company'
import  { PolicyPage } from './pages/Policy'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Default */}
        <Route
          path="/"
          element={
            <Navigate to="/login" />
          }
        />

        {/* Login */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        {/* Roles */}
        <Route
          path="/roles"
          element={<RolesPage />}
        />

        {/* Users */}
        <Route
          path="/users"
          element={<UsersPage />}
        />

        <Route
        path="/my-applications"
        element={<MyApplicationsPage />}
        />

        <Route
          path="/my-leaves"
          element={<MyLeavesPage />}
        />

        {/* Company */}
        <Route
          path="/company-configuration"
          element={<CompanyPage />}
        />

        {/* Policy */}
        <Route
          path="/policy-configuration"
          element={<PolicyPage />}
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App