# API Routes

Base URL during local development:

- `http://localhost:5085/api`

Authentication:

- `POST /auth/login`
  - Public login endpoint.
  - Request body:
    ```json
    {
      "email": "admin@pnthrhrms.com",
      "password": "Admin@123"
    }
    ```
- `POST /auth/register`
  - Requires `Admin` role.
  - Creates a new employee and profile in one operation.

Dashboard:

- `GET /dashboard/summary`
  - Requires JWT.
  - Returns top-level dashboard metrics and recent requests.

Attendance:

- `GET /attendance`
  - Requires JWT.
  - Employees receive their own attendance records.
  - Admin and Supervisor users receive all records.

Requests:

- `GET /requests`
  - Requires JWT.
  - Employees receive their own requests.
  - Admin and Supervisor users receive all requests.
- `POST /requests`
  - Requires JWT.
  - Creates a new request for the signed-in user.

Profile:

- `GET /profile/me`
  - Requires JWT.
  - Returns the signed-in employee profile.