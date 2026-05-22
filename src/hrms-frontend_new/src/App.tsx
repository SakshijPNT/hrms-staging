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

      

      </Routes>
    </BrowserRouter>
  )
}

export default App