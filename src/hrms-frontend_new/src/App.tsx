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
import { RegularizationApprovalsPage } from './pages/RegularizationApprovals'
import { MyLeavesPage } from './pages/MyLeaves'
import { MyApprovalPage } from './pages/MyApproval'
import { CompanyPage } from './pages/Company'
import { PolicyPage } from './pages/Policy'
import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/roles"
          element={
            <ProtectedRoute>
              <RolesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-applications"
          element={
            <ProtectedRoute>
              <MyApplicationsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/regularization-approvals"
          element={
            <ProtectedRoute>
              <RegularizationApprovalsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-leaves"
          element={<MyLeavesPage />}
        />

        <Route
          path="/my-approval"
          element={<MyApprovalPage />}
        />

        {/* Company */}
        <Route
          path="/company-configuration"
          element={
            <ProtectedRoute>
              <CompanyPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/policy-configuration"
          element={
            <ProtectedRoute>
              <PolicyPage />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  )
}

export default App