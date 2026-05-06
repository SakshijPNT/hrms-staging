# Deployment Guidance

Backend:

1. Set production values for `ConnectionStrings:DefaultConnection` and `Jwt` settings via environment variables or a secure secret store.
2. Publish the API:
   - `dotnet publish src/backend/Hrms.Api/Hrms.Api.csproj -c Release -o out/api`
3. Host behind IIS, Nginx, Azure App Service, or a container runtime.
4. Restrict CORS in production to the deployed frontend origin only.
5. Replace the development JWT secret with a long random secret from a managed secret vault.

Frontend:

1. Set `VITE_API_BASE_URL` to the deployed API URL.
2. Build the app:
   - `npm run build`
3. Deploy `dist/` to Azure Static Web Apps, Netlify, Vercel, IIS static hosting, or Nginx.

Database:

1. Provision PostgreSQL 15 or later.
2. Apply `database/hrms_schema.sql` if you want schema-first bootstrap.
3. Otherwise let the API create the schema through EF Core `EnsureCreated` on first run.
4. Restrict DB access to the application host and enforce strong credentials.

Production checklist:

1. Enable HTTPS end to end.
2. Rotate JWT secrets regularly.
3. Replace seeded demo users in production.
4. Add centralized logging and monitoring.
5. Add automated CI/CD validation for backend and frontend builds.