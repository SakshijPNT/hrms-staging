# PNTHR HRMS – Project Overview Document

---

## What Is This Project?

PNTHR HRMS (Human Resource Management System) is a full-stack web application built for managing employees, attendance, leave/work requests, and profiles inside an organisation. It is designed to be used by HR admins and employees through a web browser.

---

## Tech Stack Summary

| Layer       | Technology                        | Purpose                                  |
|-------------|-----------------------------------|------------------------------------------|
| Frontend    | React 19 + TypeScript + Vite      | UI rendered in the browser               |
| Styling     | Plain CSS (corporate white theme) | Clean, professional appearance           |
| API Client  | Axios                             | Makes HTTP calls from browser to backend |
| Backend     | .NET 10 Web API (C#)              | Business logic, authentication, data     |
| Database    | PostgreSQL 17                     | Stores all application data              |
| ORM         | Entity Framework Core 10          | Maps C# classes to database tables       |
| Auth        | JWT (JSON Web Tokens)             | Secure login and session management      |
| Password    | BCrypt hashing                    | Passwords are never stored in plain text |
| API Docs    | Swagger / OpenAPI                 | Browse and test API endpoints visually   |

---
 
## Architecture – How the Pieces Fit

```
Browser (React)
    │
    │  HTTP/JSON  (port 5173 → 5085)
    ▼
.NET Web API  (port 5085)
    │
    ├── Hrms.Api           → Controllers, routing, Swagger
    ├── Hrms.Application   → DTOs, service interfaces, business rules
    ├── Hrms.Domain        → Core entities (User, Role, Attendance, etc.)
    └── Hrms.Infrastructure→ Database access, JWT, BCrypt, seeding
    │
    ▼
PostgreSQL Database  (port 5432)
```

The backend follows **Clean Architecture** — the Domain has no dependencies, Application depends only on Domain, Infrastructure wires everything together, and the API exposes it over HTTP.

---

## Key Points – Frontend

- **Framework:** React 19 with TypeScript (type-safe code)
- **Build Tool:** Vite — extremely fast development server and production builder
- **Routing:** React Router v7 — different pages at different URLs (`/login`, `/dashboard`, etc.)
- **Authentication:** Auth context stores the JWT token in memory; protected routes redirect unauthenticated users to `/login`
- **API Communication:** Axios sends requests to the backend; the base URL is configured via `.env` file
- **Pages built:** Login, Dashboard, Attendance, Requests, My Profile
- **Config file:** `src/frontend/hrms-web/.env` — contains `VITE_API_BASE_URL=http://localhost:5085/api`
- **Run command:** `npm run dev` inside `src/frontend/hrms-web/`
- **Access URL:** http://localhost:5173

---

## Key Points – Backend

- **Framework:** ASP.NET Core 10 Web API — REST API returning JSON
- **Architecture:** Clean Architecture with 4 projects (Domain / Application / Infrastructure / API)
- **Authentication:** JWT tokens — user logs in, receives a token, sends it with every request
- **Authorization:** Role-based — Admin sees everything; Employee sees only their own data
- **Database ORM:** Entity Framework Core — no raw SQL needed; C# classes map to tables automatically
- **Migrations:** EF Core migrations version-control the database schema (`InitialCreate` migration applied)
- **Seeding:** On first startup, the app automatically creates roles and demo users
- **Password Security:** BCrypt — passwords are salted and hashed before being stored
- **Config file:** `src/backend/Hrms.Api/appsettings.json` — contains connection string and JWT settings
- **Run command:** `dotnet run --project src/backend/Hrms.Api`
- **Access URL:** http://localhost:5085
- **Swagger UI:** http://localhost:5085/swagger

---

## Database Configuration

| Setting   | Value       |
|-----------|-------------|
| Host      | localhost   |
| Port      | 5432        |
| Database  | postgres    |
| Username  | postgres    |
| Password  | root        |

Connection string (in `appsettings.json`):
```
Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=root
```

---

## Database Tables

| Table             | Purpose                                         |
|-------------------|-------------------------------------------------|
| Roles             | Admin, Supervisor, Employee role definitions    |
| Users             | Login credentials and role assignment           |
| EmployeeProfile   | Department, job title, phone, joining date      |
| Attendance        | Daily check-in/check-out records per employee   |
| Requests          | Leave or work requests with approval status     |

---

## Seeded Demo Accounts

| Role     | Email                      | Password      |
|----------|----------------------------|---------------|
| Admin    | admin@pnthrhrms.com        | Admin@123     |
| Employee | employee@pnthrhrms.com     | Employee@123  |

These are created automatically when the API starts for the first time.

---

## How to Run the Full Application

### Step 1 – Start the Backend
```bash
cd C:\Users\SAKSHI\OneDrive\Desktop\HRMS
dotnet run --project src\backend\Hrms.Api
```

### Step 2 – Start the Frontend
```bash
cd C:\Users\SAKSHI\OneDrive\Desktop\HRMS\src\frontend\hrms-web
npm run dev
```

### Step 3 – Open in Browser
- Application: http://localhost:5173/login
- API Docs:     http://localhost:5085/swagger

---

## API Endpoints (Summary)

| Method | Endpoint                        | Description                  |
|--------|---------------------------------|------------------------------|
| POST   | /api/auth/login                 | Login, returns JWT token     |
| GET    | /api/dashboard/summary          | Dashboard stats              |
| GET    | /api/attendance/my              | My attendance records        |
| POST   | /api/attendance/checkin         | Check in for today           |
| POST   | /api/attendance/checkout        | Check out for today          |
| GET    | /api/requests/my                | My submitted requests        |
| POST   | /api/requests                   | Submit a new request         |
| GET    | /api/profile/me                 | My profile details           |
| PUT    | /api/profile/me                 | Update my profile            |

Full API documentation available at: http://localhost:5085/swagger

---

## Security Highlights

- Passwords are **never stored in plain text** — BCrypt hashing with salt
- Every protected API call requires a **valid JWT token** in the Authorization header
- CORS is configured to **only allow requests from** http://localhost:5173
- Role-based authorization ensures employees **cannot access admin endpoints**

---

## Folder Structure

```
HRMS/
├── src/
│   ├── backend/
│   │   ├── Hrms.Api/              ← API controllers, Program.cs, appsettings
│   │   ├── Hrms.Application/      ← DTOs, service interfaces
│   │   ├── Hrms.Domain/           ← Entities, enums (no dependencies)
│   │   └── Hrms.Infrastructure/   ← EF Core, JWT, BCrypt, seeding
│   └── frontend/
│       └── hrms-web/
│           ├── src/pages/         ← Login, Dashboard, Attendance, Requests, Profile
│           ├── src/auth/          ← AuthContext, ProtectedRoute
│           ├── src/api/           ← Axios API clients
│           └── .env               ← VITE_API_BASE_URL config
├── database/
│   └── hrms_schema.sql            ← Raw SQL schema reference
├── docs/
│   ├── api-routes.md
│   ├── deployment.md
│   └── project-overview.md        ← This document
└── README.md
```

---

*Document prepared for PNTHR HRMS — April 2026*
