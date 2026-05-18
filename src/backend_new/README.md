# HRMS New Backend Guide

This guide covers the day-to-day workflow for the new HRMS backend and frontend.

## 1. Running The App

### Run Backend Only

From the repository root:

```powershell
dotnet run --project src/backend_new/Hrms.NewApi/Hrms.NewApi.csproj
```

The backend applies pending EF Core migrations on startup through:

```csharp
dbContext.Database.Migrate();
```

Swagger is available in Development mode at the backend URL, usually:

```text
https://localhost:<port>/swagger
```

### Run Frontend Only

From the repository root:

```powershell
cd src/frontend/hrms-web
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

### Run Frontend And Backend Together

Open two PowerShell terminals.

Terminal 1:

```powershell
cd "c:\HR Portal\HR-Management-System"
dotnet run --project src/backend_new/Hrms.NewApi/Hrms.NewApi.csproj
```

Terminal 2:

```powershell
cd "c:\HR Portal\HR-Management-System\src\frontend\hrms-web"
npm run dev
```

The backend CORS policy already allows:

```text
http://localhost:5173
https://localhost:5173
```

## 2. Creating A New Table

Example: adding `departmentmaster`.

### Step 1: Add Entity

Add a class in `src/backend_new/Hrms.NewApi/Models/Entities.cs`:

```csharp
public class DepartmentMaster
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string DepartmentName { get; set; } = null!;
    public string? Description { get; set; }
    public short StatusCode { get; set; } = 1;
    public int CreatedBy { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
    public int UpdatedBy { get; set; }
    public DateTimeOffset UpdatedOn { get; set; }
}
```

### Step 2: Add DbSet

In `src/backend_new/Hrms.NewApi/Data/HrmsDbContext.cs`:

```csharp
public DbSet<DepartmentMaster> DepartmentMasters => Set<DepartmentMaster>();
```

### Step 3: Add Mapping

Inside `OnModelCreating`:

```csharp
modelBuilder.Entity<DepartmentMaster>(entity =>
{
    entity.ToTable("departmentmaster");
    entity.Property(x => x.DepartmentName).IsRequired().HasMaxLength(100);
    entity.Property(x => x.Description).HasMaxLength(255);
    entity.Property(x => x.StatusCode).IsRequired().HasDefaultValue((short)1);
    entity.Property(x => x.CreatedOn).HasDefaultValueSql("NOW()");
    entity.Property(x => x.UpdatedOn).HasDefaultValueSql("NOW()");

    entity.HasIndex(x => new { x.CompanyId, x.DepartmentName })
        .IsUnique()
        .HasDatabaseName("uq_departmentmaster_company_name");
});
```

The project already lowercases column names globally in `HrmsDbContext`.

### Step 4: Create Migration

```powershell
dotnet ef migrations add AddDepartmentMaster --configuration Release --project src/backend_new/Hrms.NewApi/Hrms.NewApi.csproj --startup-project src/backend_new/Hrms.NewApi/Hrms.NewApi.csproj
```

Check the generated migration. For a new table, it should contain:

```csharp
migrationBuilder.CreateTable(...)
```

### Step 5: Apply Migration

```powershell
dotnet ef database update --configuration Release --project src/backend_new/Hrms.NewApi/Hrms.NewApi.csproj --startup-project src/backend_new/Hrms.NewApi/Hrms.NewApi.csproj
```

You can also run the backend, because migrations apply on startup.

## 3. Adding Or Deleting Columns

### Add A Column

Example: add `ActivityName` to `activitymaster`.

1. Add property in `Entities.cs`:

```csharp
public string ActivityName { get; set; } = null!;
```

2. Add mapping in `HrmsDbContext.cs`:

```csharp
entity.Property(x => x.ActivityName).IsRequired().HasMaxLength(100);
```

3. Create migration:

```powershell
dotnet ef migrations add AddActivityNameToActivityMaster --configuration Release --project src/backend_new/Hrms.NewApi/Hrms.NewApi.csproj --startup-project src/backend_new/Hrms.NewApi/Hrms.NewApi.csproj
```

4. Check the migration. It should contain:

```csharp
migrationBuilder.AddColumn(...)
```

5. Apply migration:

```powershell
dotnet ef database update --configuration Release --project src/backend_new/Hrms.NewApi/Hrms.NewApi.csproj --startup-project src/backend_new/Hrms.NewApi/Hrms.NewApi.csproj
```

### Delete A Column

1. Remove the property from `Entities.cs`.
2. Remove related mapping from `HrmsDbContext.cs`.
3. Create migration:

```powershell
dotnet ef migrations add RemoveActivityNameFromActivityMaster --configuration Release --project src/backend_new/Hrms.NewApi/Hrms.NewApi.csproj --startup-project src/backend_new/Hrms.NewApi/Hrms.NewApi.csproj
```

4. Check the migration. It should contain:

```csharp
migrationBuilder.DropColumn(...)
```

5. Apply migration:

```powershell
dotnet ef database update --configuration Release --project src/backend_new/Hrms.NewApi/Hrms.NewApi.csproj --startup-project src/backend_new/Hrms.NewApi/Hrms.NewApi.csproj
```

Warning: dropping a column deletes all data in that column.

## 4. New Backend API Structure

The new backend follows this flow:

```text
HTTP Request
    -> Controller
    -> Manager Interface
    -> Manager
    -> HrmsDbContext
    -> PostgreSQL
```

Response comes back in reverse:

```text
PostgreSQL
    -> HrmsDbContext
    -> Manager
    -> Controller
    -> HTTP Response
```

### Example: Create Role

Request:

```http
POST /api/roles
```

Body:

```json
{
  "roleName": "Manager",
  "description": "Approves leave requests",
  "statusCode": 1,
  "createdBy": 1,
  "updatedBy": 1
}
```

Flow:

```text
RolesController.CreateRole(...)
    receives RoleUpsertDto
    reads CompanyId from session if request.CompanyId is null
    calls IRoleManager.CreateRoleAsync(...)

RoleManager.CreateRoleAsync(...)
    validates company
    checks duplicate role name inside the same company
    creates RoleMaster entity
    saves through HrmsDbContext.RoleMasters
    returns RoleResponseDto

RolesController
    returns 201 Created with RoleResponseDto
```

Files involved:

```text
Controllers/RolesController.cs
Dtos/RoleUpsertDto.cs
Dtos/RoleResponseDto.cs
Interfaces/IRoleManager.cs
Managers/RoleManager.cs
Data/HrmsDbContext.cs
Models/Entities.cs
```

### Example: Create User

Request:

```http
POST /api/users
```

Flow:

```text
UsersController.CreateUser(...)
    receives UserUpsertDto
    calls IUserManager.CreateUserAsync(...)

UserManager.CreateUserAsync(...)
    validates company, role, manager, and duplicate EmailId
    hashes the password using ASP.NET Core PasswordHasher
    creates UserMaster entity
    saves through HrmsDbContext.UserMasters
    returns UserResponseDto
```

Files involved:

```text
Controllers/UsersController.cs
Dtos/UserUpsertDto.cs
Dtos/UserResponseDto.cs
Interfaces/IUserManager.cs
Managers/UserManager.cs
Data/HrmsDbContext.cs
Models/Entities.cs
```

### Where To Put New API Code

For a new feature, usually add:

```text
Dtos/<Feature>UpsertDto.cs
Dtos/<Feature>ResponseDto.cs
Interfaces/I<Feature>Manager.cs
Managers/<Feature>Manager.cs
Controllers/<Feature>Controller.cs
```

Then register the manager in:

```text
Extensions/ApplicationServiceCollectionExtensions.cs
```

Example:

```csharp
services.AddScoped<IRoleManager, RoleManager>();
```

### Session Usage

Login stores session data in:

```text
UserSession
```

The DTO is:

```text
SessionInfoDto
```

Controllers that need the logged-in company read:

```csharp
var rawSession = HttpContext.Session.GetString("UserSession");
var session = JsonSerializer.Deserialize<SessionInfoDto>(rawSession);
var companyId = session.CompanyId;
```

Current examples:

```text
AuthController.cs
UsersController.cs
RolesController.cs
```
