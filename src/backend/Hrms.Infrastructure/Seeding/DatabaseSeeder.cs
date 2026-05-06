using Hrms.Domain.Entities;
using Hrms.Domain.Enums;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Seeding;

public sealed class DatabaseSeeder(HrmsDbContext dbContext)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await dbContext.Database.EnsureCreatedAsync(cancellationToken);

        var expectedActivities = new[]
        {
            new Activity { Name = "Settings", Code = "A1", Description = "Access application settings.", Type = "Module", ModuleCode = "SETTINGS", ModuleName = "Settings" },
            new Activity { Name = "Role Management", Code = "A2", Description = "Access role and activity management.", Type = "Module", ModuleCode = "ROLES", ModuleName = "Role Management" },
            new Activity { Name = "Users", Code = "A3", Description = "Access the users module.", Type = "Module", ModuleCode = "USERS", ModuleName = "Users" },
            new Activity { Name = "My Reportees", Code = "A4", Description = "Access reportees and reporting hierarchy.", Type = "Module", ModuleCode = "REPORTEES", ModuleName = "My Reportees" },
            new Activity { Name = "Request", Code = "A5", Description = "Access employee requests.", Type = "Module", ModuleCode = "REQUESTS", ModuleName = "Request" },
            new Activity { Name = "Approval", Code = "A6", Description = "Access approval workflows.", Type = "Module", ModuleCode = "APPROVALS", ModuleName = "Approval" },
            new Activity { Name = "My Leaves", Code = "A7", Description = "Access personal leave information.", Type = "Module", ModuleCode = "LEAVES", ModuleName = "My Leaves" },
            new Activity { Name = "Reports", Code = "A8", Description = "Access reports and analytics.", Type = "Module", ModuleCode = "REPORTS", ModuleName = "Reports" },
            new Activity { Name = "Dashboard", Code = "A9", Description = "Access the dashboard overview.", Type = "Module", ModuleCode = "DASHBOARD", ModuleName = "Dashboard" }
        };

        var expectedCodes = expectedActivities.Select(item => item.Code).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var currentActivities = await dbContext.Activities.ToListAsync(cancellationToken);

        foreach (var expected in expectedActivities)
        {
            var existing = currentActivities.FirstOrDefault(item => item.Code == expected.Code);
            if (existing is null)
            {
                dbContext.Activities.Add(expected);
                continue;
            }

            existing.Name = expected.Name;
            existing.Description = expected.Description;
            existing.Type = expected.Type;
            existing.ModuleCode = expected.ModuleCode;
            existing.ModuleName = expected.ModuleName;
        }

        var obsoleteActivities = currentActivities
            .Where(item => !expectedCodes.Contains(item.Code))
            .ToList();

        if (obsoleteActivities.Count > 0)
        {
            var obsoleteIds = obsoleteActivities.Select(item => item.Id).ToHashSet();
            var obsoleteActivityRoleLinks = await dbContext.RoleActivities
                .Where(item => obsoleteIds.Contains(item.ActivityId))
                .ToListAsync(cancellationToken);

            if (obsoleteActivityRoleLinks.Count > 0)
            {
                dbContext.RoleActivities.RemoveRange(obsoleteActivityRoleLinks);
            }

            dbContext.Activities.RemoveRange(obsoleteActivities);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        if (!await dbContext.Roles.AnyAsync(cancellationToken))
        {
            dbContext.Roles.AddRange(
                new Role { Name = "Admin", Description = "Full system administrator" },
                new Role { Name = "Supervisor", Description = "Team lead and approval manager" },
                new Role { Name = "Employee", Description = "Standard employee access" });

            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var roles = await dbContext.Roles.ToDictionaryAsync(role => role.Name, cancellationToken);
        var activitiesByCode = await dbContext.Activities.ToDictionaryAsync(activity => activity.Code, cancellationToken);
        var existingRoleActivities = await dbContext.RoleActivities
            .ToListAsync(cancellationToken);

        // Preserve admin-managed role activity assignments after initial bootstrap.
        // Seed defaults only when no role-activity rows exist.
        if (existingRoleActivities.Count == 0)
        {
            var expectedRoleActivityPairs = new List<(Guid RoleId, Guid ActivityId)>();

            void AddExpectedRoleActivity(string roleName, string activityCode)
            {
                if (!roles.TryGetValue(roleName, out var role) || !activitiesByCode.TryGetValue(activityCode, out var activity))
                {
                    return;
                }

                expectedRoleActivityPairs.Add((role.Id, activity.Id));
            }

            foreach (var adminActivity in expectedActivities)
            {
                AddExpectedRoleActivity("Admin", adminActivity.Code);
            }

            var supervisorActivityCodes = new[]
            {
                "A4",
                "A5",
                "A6",
                "A8",
                "A9"
            };

            foreach (var activityCode in supervisorActivityCodes)
            {
                AddExpectedRoleActivity("Supervisor", activityCode);
            }

            var employeeActivityCodes = new[]
            {
                "A5",
                "A7",
                "A9"
            };

            foreach (var activityCode in employeeActivityCodes)
            {
                AddExpectedRoleActivity("Employee", activityCode);
            }

            if (expectedRoleActivityPairs.Count > 0)
            {
                dbContext.RoleActivities.AddRange(expectedRoleActivityPairs.Select(pair => new RoleActivity
                {
                    RoleId = pair.RoleId,
                    ActivityId = pair.ActivityId
                }));
            }

            await dbContext.SaveChangesAsync(cancellationToken);
        }

        // Seed Permissions (View + Edit for each activity)
        var allActivities = await dbContext.Activities.ToListAsync(cancellationToken);
        var existingPermissions = await dbContext.Permissions.ToListAsync(cancellationToken);

        var permissionTypes = new[] { "View", "Edit" };
        foreach (var activity in allActivities)
        {
            foreach (var pType in permissionTypes)
            {
                var permName = $"{activity.ModuleCode}_{pType.ToUpperInvariant()}";
                var exists = existingPermissions.Any(p => p.ActivityId == activity.Id && p.PermissionType == pType);
                if (!exists)
                {
                    dbContext.Permissions.Add(new Hrms.Domain.Entities.Permission
                    {
                        Id = Guid.NewGuid(),
                        ActivityId = activity.Id,
                        PermissionName = permName,
                        PermissionType = pType,
                        CreatedUtc = DateTime.UtcNow,
                    });
                }
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var adminRole = await dbContext.Roles.SingleAsync(role => role.Name == "Admin", cancellationToken);
        var employeeRole = await dbContext.Roles.SingleAsync(role => role.Name == "Employee", cancellationToken);

        var adminUser = await dbContext.Users.SingleOrDefaultAsync(
            user => user.Email == "admin@pnthrhrms.com",
            cancellationToken);

        if (adminUser is null)
        {
            adminUser = new User
            {
                Email = "admin@pnthrhrms.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                FirstName = "System",
                LastName = "Admin",
                RoleId = adminRole.Id,
                IsActive = true
            };

            dbContext.Users.Add(adminUser);
        }
        else
        {
            // Keep development login stable for admin account.
            adminUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123");
            adminUser.RoleId = adminRole.Id;
            adminUser.IsActive = true;
        }

        var employeeUser = await dbContext.Users.SingleOrDefaultAsync(
            user => user.Email == "employee@pnthrhrms.com",
            cancellationToken);

        if (employeeUser is null)
        {
            employeeUser = new User
            {
                Email = "employee@pnthrhrms.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Employee@123"),
                FirstName = "Aarav",
                LastName = "Sharma",
                RoleId = employeeRole.Id,
                IsActive = true
            };

            dbContext.Users.Add(employeeUser);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var hasAdminProfile = await dbContext.EmployeeProfiles
            .AnyAsync(profile => profile.UserId == adminUser.Id, cancellationToken);
        if (!hasAdminProfile)
        {
            dbContext.EmployeeProfiles.Add(new EmployeeProfile
            {
                UserId = adminUser.Id,
                EmployeeCode = "PNTHR-ADM-001",
                Department = "Administration",
                JobTitle = "HRMS Platform Owner",
                PhoneNumber = "+91-9000000001",
                DateOfJoining = new DateOnly(2024, 1, 15)
            });
        }

        var hasEmployeeProfile = await dbContext.EmployeeProfiles
            .AnyAsync(profile => profile.UserId == employeeUser.Id, cancellationToken);
        if (!hasEmployeeProfile)
        {
            dbContext.EmployeeProfiles.Add(new EmployeeProfile
            {
                UserId = employeeUser.Id,
                EmployeeCode = "PNTHR-EMP-101",
                Department = "Engineering",
                JobTitle = "Software Engineer",
                PhoneNumber = "+91-9000000002",
                DateOfJoining = new DateOnly(2024, 5, 12)
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // Remove legacy "today" seed rows (from earlier builds) so check-in is available for live interaction.
        var legacyTodaySeedAttendance = await dbContext.AttendanceRecords
            .Where(record =>
                record.WorkDate == today
                && record.CheckOutUtc == null
                && (record.Notes == "Leadership sync and governance review" || record.Notes == "Remote sprint delivery"))
            .ToListAsync(cancellationToken);
        if (legacyTodaySeedAttendance.Count > 0)
        {
            dbContext.AttendanceRecords.RemoveRange(legacyTodaySeedAttendance);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var seedWorkDate = today.AddDays(-1);

        var hasAdminAttendanceSeed = await dbContext.AttendanceRecords
            .AnyAsync(record => record.UserId == adminUser.Id && record.WorkDate == seedWorkDate, cancellationToken);
        if (!hasAdminAttendanceSeed)
        {
            dbContext.AttendanceRecords.Add(new AttendanceRecord
            {
                UserId = adminUser.Id,
                WorkDate = seedWorkDate,
                CheckInUtc = DateTime.UtcNow.Date.AddDays(-1).AddHours(3),
                Status = AttendanceStatus.Present,
                Notes = "Leadership sync and governance review"
            });
        }

        var hasEmployeeAttendanceSeed = await dbContext.AttendanceRecords
            .AnyAsync(record => record.UserId == employeeUser.Id && record.WorkDate == seedWorkDate, cancellationToken);
        if (!hasEmployeeAttendanceSeed)
        {
            dbContext.AttendanceRecords.Add(new AttendanceRecord
            {
                UserId = employeeUser.Id,
                WorkDate = seedWorkDate,
                CheckInUtc = DateTime.UtcNow.Date.AddDays(-1).AddHours(4),
                Status = AttendanceStatus.WorkFromHome,
                Notes = "Remote sprint delivery"
            });
        }

        var annualLeaveStart = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10));
        var annualLeaveEnd = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(12));
        var hasAnnualLeaveSeed = await dbContext.Requests.AnyAsync(
            request => request.UserId == employeeUser.Id
                       && request.Title == "Annual Leave"
                       && request.StartDate == annualLeaveStart
                       && request.EndDate == annualLeaveEnd,
            cancellationToken);

        if (!hasAnnualLeaveSeed)
        {
            dbContext.Requests.Add(new EmployeeRequest
            {
                UserId = employeeUser.Id,
                Title = "Annual Leave",
                Description = "Family travel during the first week of next month.",
                StartDate = annualLeaveStart,
                EndDate = annualLeaveEnd,
                Status = RequestStatus.Pending
            });
        }

        var wfhExtensionStart = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(3));
        var wfhExtensionEnd = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(4));
        var hasWfhExtensionSeed = await dbContext.Requests.AnyAsync(
            request => request.UserId == employeeUser.Id
                       && request.Title == "Work From Home Extension"
                       && request.StartDate == wfhExtensionStart
                       && request.EndDate == wfhExtensionEnd,
            cancellationToken);

        if (!hasWfhExtensionSeed)
        {
            dbContext.Requests.Add(new EmployeeRequest
            {
                UserId = employeeUser.Id,
                Title = "Work From Home Extension",
                Description = "Need two extra WFH days to complete release hardening.",
                StartDate = wfhExtensionStart,
                EndDate = wfhExtensionEnd,
                Status = RequestStatus.Approved,
                ReviewedById = adminUser.Id,
                ReviewedAtUtc = DateTime.UtcNow.AddDays(-1),
                DecisionNotes = "Approved for release support."
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}