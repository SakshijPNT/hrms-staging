import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AppShell } from './components/layout/AppShell'
import { ActivityRoute } from './components/routing/ActivityRoute'
import { ProtectedRoute } from './components/routing/ProtectedRoute'
import { PublicOnlyRoute } from './components/routing/PublicOnlyRoute'
import { AdminSectionPage } from './pages/AdminSectionPage'
import { ActivitiesPage } from './pages/ActivitiesPage'
import { AttendancePage } from './pages/AttendancePage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { RolesPage } from './pages/RolesPage'
import { RequestsPage } from './pages/RequestsPage'
import { SettingsPage } from './pages/SettingsPage'
import { UsersPage } from './pages/UsersPage'

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<ActivityRoute><DashboardPage /></ActivityRoute>} />
          <Route path="/attendance" element={<ActivityRoute><AttendancePage /></ActivityRoute>} />
          <Route
            path="/attendance-status"
            element={
              <ActivityRoute>
                <AdminSectionPage
                  kicker="Workforce operations"
                  title="Attendance Status"
                  description="Track present, remote, on-leave, and escalation-ready employee attendance from a single operations board."
                  highlights={['Daily attendance visibility', 'Shift exceptions', 'Late check-in review']}
                  focusAreas={[
                    { label: 'Live View', value: 'Present, absent, late, remote, leave' },
                    { label: 'Primary Use', value: 'HR attendance monitoring and interventions' },
                    { label: 'Admin Action', value: 'Investigate anomalies and compliance gaps' },
                  ]}
                />
              </ActivityRoute>
            }
          />
          <Route path="/users" element={<ActivityRoute><UsersPage /></ActivityRoute>} />
          <Route
            path="/my-reportees"
            element={
              <ActivityRoute>
                <AdminSectionPage
                  kicker="Team oversight"
                  title="My Reportees"
                  description="Give reporting managers visibility into direct reports, workload, requests, and attendance trends."
                  highlights={['Reporting tree view', 'Pending team actions', 'Escalation follow-up']}
                  focusAreas={[
                    { label: 'Primary Use', value: 'Manager visibility into direct reports' },
                    { label: 'Decision Surface', value: 'Requests, leaves, attendance, and alerts' },
                    { label: 'Next Step', value: 'Integrate reporting hierarchy data from HRIS' },
                  ]}
                />
              </ActivityRoute>
            }
          />
          <Route path="/requests" element={<ActivityRoute><RequestsPage /></ActivityRoute>} />
          <Route
            path="/approvals"
            element={
              <ActivityRoute>
                <AdminSectionPage
                  kicker="Decision center"
                  title="Approvals"
                  description="Review submitted employee requests, verify context, and act on approval workflows with clear status visibility."
                  highlights={['Approval backlog', 'Decision notes', 'Audit-friendly review trail']}
                  focusAreas={[
                    { label: 'Primary Use', value: 'Approve or reject employee workflows' },
                    { label: 'Users', value: 'Admins and supervisors with elevated access' },
                    { label: 'Linked Modules', value: 'Requests, leaves, reportees, attendance' },
                  ]}
                />
              </ActivityRoute>
            }
          />
          <Route
            path="/my-leaves"
            element={
              <ActivityRoute>
                <AdminSectionPage
                  kicker="Employee self-service"
                  title="My Leaves"
                  description="Give employees a clean personal leave summary with upcoming leave, balances, and current request status."
                  highlights={['Leave visibility', 'Personal balances', 'Application history']}
                  focusAreas={[
                    { label: 'Primary Use', value: 'Employee leave tracking and history' },
                    { label: 'Status View', value: 'Approved, pending, rejected, upcoming' },
                    { label: 'Next Step', value: 'Wire leave balance and calendar data' },
                  ]}
                />
              </ActivityRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ActivityRoute>
                <AdminSectionPage
                  kicker="Analytics"
                  title="Reports"
                  description="Surface attendance, request, and workforce summaries in a manager-ready reporting workspace."
                  highlights={['Monthly summaries', 'Department drill-down', 'Export-ready views']}
                  focusAreas={[
                    { label: 'Primary Use', value: 'Operational and management reporting' },
                    { label: 'Consumers', value: 'HR admins, managers, leadership' },
                    { label: 'Next Step', value: 'Add filters and CSV/PDF exports' },
                  ]}
                />
              </ActivityRoute>
            }
          />
          <Route path="/activities" element={<ActivityRoute><ActivitiesPage /></ActivityRoute>} />
          <Route path="/roles" element={<ActivityRoute><RolesPage /></ActivityRoute>} />
          <Route
            path="/settings"
            element={
              <ActivityRoute>
                <SettingsPage />
              </ActivityRoute>
            }
          />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
