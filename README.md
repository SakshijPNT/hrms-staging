# PNTHR HRMS

Enterprise-grade HRMS starter built with .NET 10 Web API, PostgreSQL, Entity Framework Core, JWT authentication, role-based authorization, and a React 19 frontend.

## Implemented Scope

- Clean backend separation across Domain, Application, Infrastructure, and API.
- JWT-based login flow with seeded demo users.
- Role-based access for `Employee`, `Supervisor`, and `Admin`.
- PostgreSQL-ready data model for `Users`, `Roles`, `Attendance`, `Requests`, and `EmployeeProfile`.
- Professional React dashboard UI with login-first flow, protected routes, sidebar navigation, topbar identity, and white corporate styling.
- Phase 1 pages for Dashboard, Attendance, Requests, My Profile, and Logout.

## Project Structure

```text
HRMS/
├── Hrms.sln
├── database/
│   └── hrms_schema.sql
├── docs/
│   ├── api-routes.md
│   └── deployment.md
├── src/
│   ├── backend/
│   │   ├── Hrms.Api/
│   │   ├── Hrms.Application/
│   │   ├── Hrms.Domain/
│   │   └── Hrms.Infrastructure/
│   └── frontend/
│       └── hrms-web/
└── README.md
```

## Seeded Access

- Admin: `admin@pnthrhrms.com` / `Admin@123`
- Employee: `employee@pnthrhrms.com` / `Employee@123`

These accounts are created automatically when the API boots against an empty database.

## PostgreSQL Setup

Update the connection string placeholders in both files before running the API:

- `src/backend/Hrms.Api/appsettings.json`
- `src/backend/Hrms.Api/appsettings.Development.json`

Example:

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5432;Database=hrms_db;Username=postgres;Password=YOUR_PASSWORD"
}
```

If you want me to wire your actual PostgreSQL username, password, host, or port into the config, send those details and I can update the environment files directly.

## Local Run Instructions

### 1. Backend

```powershell
cd src/backend/Hrms.Api
dotnet run
```

Local endpoints:

- HTTP: `http://localhost:5085`
- HTTPS: `https://localhost:7004`
- Swagger UI: `https://localhost:7004/swagger`

### 2. Frontend

Copy the environment example if needed:

```powershell
cd src/frontend/hrms-web
copy .env.example .env.local
```

Run the dev server:

```powershell
cd src/frontend/hrms-web
npm install
npm run dev
```

Frontend URL:

- `http://localhost:5173`

The app loads the login page first and redirects to the dashboard after successful authentication.

## Build Validation

Validated locally in this workspace:

- `dotnet build Hrms.sln`
- `npm run build` in `src/frontend/hrms-web`

## Authentication Flow

1. User lands on `/login`.
2. Login form posts to `POST /api/auth/login`.
3. API validates the hashed password and returns a JWT plus user profile data.
4. Frontend stores the token and user session in local storage.
5. Protected routes unlock the dashboard shell.
6. Axios attaches the bearer token automatically to secured API calls.

## Backend Notes

- The API uses EF Core with Npgsql.
- Schema bootstrap is handled automatically with `EnsureCreated()` during startup.
- Starter seed data includes roles, two users, attendance records, and request records.

## Frontend Notes

- Sidebar includes Dashboard, Attendance, Requests, My Profile, and Logout.
- Topbar shows the logged-in user name and email.
- Requests page includes a phase-one request submission form.
- Attendance and profile pages consume live API data.

## API Summary

See `docs/api-routes.md` for route details.

## Deployment

See `docs/deployment.md` for deployment guidance.