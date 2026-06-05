# HRMS Backend — Build & Run by Environment

This guide covers how to **build**, **configure**, and **run** `Hrms.NewApi` for **local (Development / testing)** and **live (Production)** environments.

**Project path:** `src/backend_new/Hrms.NewApi/`  
**Framework:** .NET 9  
**Database:** PostgreSQL  
**Default local API URL:** `http://localhost:6001`  
**Default local frontend URL:** `http://localhost:5173` (`hrms-frontend_new`)

---

## 1. Prerequisites

| Tool | Version | Notes |
|------|---------|--------|
| [.NET SDK](https://dotnet.microsoft.com/download) | 9.x | Run `dotnet --version` |
| PostgreSQL | 15+ | Testing DB and/or live RDS |
| Git | Any | Clone the repository |

Optional for migrations:

```powershell
dotnet tool install --global dotnet-ef
```

---

## 2. How configuration works

ASP.NET Core loads settings in this order (later overrides earlier):

1. `appsettings.json` — base defaults  
2. `appsettings.{Environment}.json` — e.g. `Development` or `Production`  
3. Environment variables  
4. Command-line arguments  

The active environment is set by:

```text
ASPNETCORE_ENVIRONMENT=Development   # local
ASPNETCORE_ENVIRONMENT=Production    # live
```

### Config files in this project

| File | Committed to Git | Purpose |
|------|------------------|---------|
| `appsettings.json` | Yes | Base settings (CORS fallback, shared defaults) |
| `appsettings.Development.json` | **No** (gitignored) | Local DB + local frontend URLs |
| `appsettings.Production.json` | Yes | Live frontend URL (connection string via env on server) |
| `appsettings.Development.example.json` | Yes | Template — copy to create local config |
| `appsettings.Production.example.json` | Yes | Template for production values |

### Important settings

**Connection string** (PostgreSQL):

```json
"ConnectionStrings": {
  "DefaultConnection": "Host=...;Port=5432;Database=...;Username=...;Password=...;SSL Mode=Require;Trust Server Certificate=true;"
}
```

**CORS** (frontend URLs allowed to call the API with cookies):

```json
"Cors": {
  "AllowedOrigins": [
    "http://localhost:5173"
  ]
}
```

On startup the API logs:

```text
CORS allowed origins: http://localhost:5173, ...
```

---

## 3. Local / Development (testing database)

Use this for day-to-day development against your **testing** database.

### Step 1 — Create local config

From the repo root:

```powershell
Copy-Item `
  src/backend_new/Hrms.NewApi/appsettings.Development.example.json `
  src/backend_new/Hrms.NewApi/appsettings.Development.json
```

Edit `appsettings.Development.json`:

- Set `ConnectionStrings:DefaultConnection` to your **testing** PostgreSQL host/database.  
- Keep CORS origins as local Vite URLs:

```json
"Cors": {
  "AllowedOrigins": [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ]
}
```

> **Do not commit** `appsettings.Development.json` — it is listed in `.gitignore`.

### Step 2 — Restore and build

```powershell
cd src/backend_new/Hrms.NewApi

dotnet restore
dotnet build -c Debug
```

### Step 3 — Run (Development)

```powershell
dotnet run --launch-profile http
```

Or from repo root:

```powershell
dotnet run --project src/backend_new/Hrms.NewApi/Hrms.NewApi.csproj --launch-profile http
```

This sets:

- `ASPNETCORE_ENVIRONMENT=Development`  
- URL: `http://localhost:6001`  

**Swagger** is enabled in Development:

```text
http://localhost:6001/swagger
```

### Step 4 — Verify

1. API starts without migration errors.  
2. Log shows CORS origins including `http://localhost:5173`.  
3. Frontend (`hrms-frontend_new`) uses `http://localhost:6001/api` with `withCredentials: true`.  
4. Login works and session cookie is set.

### Development — Release build (optional)

```powershell
dotnet build -c Release
dotnet run -c Release --launch-profile http --no-build
```

---

## 4. Production / Live

Use this for deployment to a server (IIS, Linux + systemd, Docker, Azure App Service, etc.) against your **live** database.

### Step 1 — Configure production settings

Edit `appsettings.Production.json` **or** set values on the server (recommended for secrets):

```json
{
  "ConnectionStrings": {
    "DefaultConnection": ""
  },
  "Cors": {
    "AllowedOrigins": [
      "https://your-actual-live-frontend-domain.com"
    ]
  }
}
```

Replace `https://your-actual-live-frontend-domain.com` with the real deployed frontend URL (no trailing slash).

**Do not store production passwords in Git.** Set the connection string via environment variable on the server:

```powershell
$env:ConnectionStrings__DefaultConnection = "Host=pxp....rds.amazonaws.com;Port=5432;Database=HRMS-Live;Username=postgres;Password=***;SSL Mode=Require;Trust Server Certificate=true;"
$env:ASPNETCORE_ENVIRONMENT = "Production"
```

Linux / Docker example:

```bash
export ASPNETCORE_ENVIRONMENT=Production
export ConnectionStrings__DefaultConnection="Host=...;Port=5432;Database=HRMS-Live;..."
export Cors__AllowedOrigins__0="https://your-live-frontend-domain.com"
```

### Step 2 — Build for production

```powershell
cd src/backend_new/Hrms.NewApi

dotnet restore
dotnet build -c Release
```

### Step 3 — Publish

```powershell
dotnet publish -c Release -o ./publish
```

Output folder: `src/backend_new/Hrms.NewApi/publish/`

Run the published app:

```powershell
cd publish
$env:ASPNETCORE_ENVIRONMENT = "Production"
dotnet Hrms.NewApi.dll --urls "http://0.0.0.0:6001"
```

Adjust `--urls` for HTTPS termination (often handled by reverse proxy/nginx/IIS).

### Step 4 — Production checklist

| Item | Action |
|------|--------|
| Environment | `ASPNETCORE_ENVIRONMENT=Production` |
| Database | Live PostgreSQL (`HRMS-Live` or agreed name) |
| CORS | Only live frontend origin(s) |
| Secrets | Connection string via env / secret manager, not in repo |
| HTTPS | Enable HTTPS end-to-end (proxy or Kestrel) |
| Swagger | Disabled automatically (Development only) |
| Migrations | Run on deploy; API applies pending migrations on startup |
| Frontend | Production build points to live API URL |

---

## 5. Environment comparison

| | Development (local) | Production (live) |
|---|---------------------|-------------------|
| `ASPNETCORE_ENVIRONMENT` | `Development` | `Production` |
| Config file | `appsettings.Development.json` | `appsettings.Production.json` + env vars |
| Database | Testing DB | Live DB (`HRMS-Live`) |
| Frontend URL (CORS) | `http://localhost:5173` | `https://your-live-domain.com` |
| API URL | `http://localhost:6001` | Your server / load balancer URL |
| Swagger | Yes | No |
| Build config | `Debug` (local) / `Release` | `Release` |

---

## 6. Database migrations

Migrations run automatically when the API starts (`Program.cs` → `Database.Migrate()`).

Apply manually if needed:

```powershell
cd src/backend_new/Hrms.NewApi

dotnet ef database update
```

Use the same connection string as the target environment (Development vs Production).

---

## 7. Frontend pairing

| Environment | Frontend project | API base URL |
|-------------|------------------|--------------|
| Local | `src/hrms-frontend_new` | `http://localhost:6001/api` |
| Live | Deployed `hrms-frontend_new` build | `https://your-live-api-domain.com/api` |

CORS on the backend must include the **exact** frontend origin (scheme + host + port).

---

## 8. Troubleshooting

### Build fails — file locked

```text
The process cannot access the file ... Hrms.NewApi.dll because it is being used by another process
```

**Fix:** Stop the running API process, then build again.

```powershell
# Find and stop the process, or close the terminal running dotnet run
dotnet build -c Release
```

### CORS error in browser

- Frontend origin must match an entry in `Cors:AllowedOrigins`.  
- Check API startup log for allowed origins.  
- Session auth requires `withCredentials: true` on the frontend and matching CORS with credentials.

### Migration failed on startup

- Verify PostgreSQL is reachable from the machine running the API.  
- Check `ConnectionStrings:DefaultConnection` for the active environment.  
- Ensure the database exists and the user has create/migrate permissions.

### Wrong database (test data on live or vice versa)

- Confirm `ASPNETCORE_ENVIRONMENT` on the server.  
- Confirm `ConnectionStrings__DefaultConnection` points to the intended host/database.

---

## 9. Quick command reference

```powershell
# Local — first-time setup
Copy-Item src/backend_new/Hrms.NewApi/appsettings.Development.example.json `
          src/backend_new/Hrms.NewApi/appsettings.Development.json

# Local — run
dotnet run --project src/backend_new/Hrms.NewApi/Hrms.NewApi.csproj --launch-profile http

# Production — build & publish
dotnet publish src/backend_new/Hrms.NewApi/Hrms.NewApi.csproj -c Release -o ./publish

# Production — run published app
$env:ASPNETCORE_ENVIRONMENT = "Production"
dotnet ./publish/Hrms.NewApi.dll
```

---

## 10. Security reminders

1. Never commit real passwords to Git.  
2. Use `appsettings.Development.json` locally (gitignored) for test credentials.  
3. Use environment variables or a secret store for production connection strings.  
4. Restrict production CORS to the live frontend domain only.  
5. Rotate credentials if they were ever shared in chat or committed by mistake.
