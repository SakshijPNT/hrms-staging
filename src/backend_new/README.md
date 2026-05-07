# HRMS .NET 9 Backend (New)

This folder contains a new .NET 9 backend project for the HR Management System.

## Setup

1. Install .NET 9 SDK.
2. Open PowerShell in `src/backend_new/Hrms.NewApi`.
3. Restore packages:
   ```powershell
   dotnet restore
   ```
4. Run the project:
   ```powershell
   dotnet run
   ```

## Behavior

On startup, the application ensures the PostgreSQL tables defined in the models exist by calling `Database.EnsureCreated()`.

## Connection string

The app uses `ConnectionStrings:DefaultConnection` from `appsettings.json` or the `DATABASE_URL` environment variable.
