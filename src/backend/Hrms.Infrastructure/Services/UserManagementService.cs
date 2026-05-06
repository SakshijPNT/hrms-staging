using Hrms.Application.DTOs.Administration;
using Hrms.Application.Interfaces.Repositories;
using Hrms.Application.Interfaces.Security;
using Hrms.Application.Interfaces.Services;
using Hrms.Domain.Entities;

namespace Hrms.Infrastructure.Services;

public sealed class UserManagementService(
    IUserRepository userRepository,
    IRoleRepository roleRepository,
    IEmployeeProfileRepository employeeProfileRepository,
    IPasswordHasher passwordHasher) : IUserManagementService
{
    public async Task<IReadOnlyList<CompanyUserDto>> GetUsersAsync(CancellationToken cancellationToken = default)
    {
        var users = await userRepository.GetAllAsync(cancellationToken);
        return users.Select(MapUser).ToList();
    }

    public async Task<CompanyUserDto> CreateAsync(
        CreateCompanyUserRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (await userRepository.ExistsByEmailAsync(normalizedEmail, cancellationToken))
        {
            throw new InvalidOperationException("A user with this email already exists.");
        }

        var nextNumber = await employeeProfileRepository.GetNextCodeNumberAsync(cancellationToken);
        var normalizedEmployeeCode = $"PNT-EMP-{nextNumber}";

        var role = await roleRepository.GetByNameAsync(request.RoleName, cancellationToken)
            ?? throw new InvalidOperationException("Requested role is not configured.");

        var user = new User
        {
            Email = normalizedEmail,
            PasswordHash = passwordHasher.Hash("Welcome@123"),
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            RoleId = role.Id,
            Role = role,
            IsActive = true
        };

        await userRepository.AddAsync(user, cancellationToken);

        var profile = new EmployeeProfile
        {
            UserId = user.Id,
            EmployeeCode = normalizedEmployeeCode,
            Department = request.Department.Trim(),
            JobTitle = request.JobTitle.Trim(),
            PhoneNumber = request.PhoneNumber.Trim(),
            DateOfJoining = request.DateOfJoining
        };

        await employeeProfileRepository.AddAsync(profile, cancellationToken);
        user.EmployeeProfile = profile;

        return MapUser(user);
    }

    public async Task<CompanyUserDto> UpdateAsync(
        Guid userId,
        UpdateCompanyUserRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");

        var profile = user.EmployeeProfile
            ?? throw new InvalidOperationException("User profile not found.");

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (!string.Equals(normalizedEmail, user.Email, StringComparison.OrdinalIgnoreCase)
            && await userRepository.ExistsByEmailAsync(normalizedEmail, cancellationToken))
        {
            throw new InvalidOperationException("A user with this email already exists.");
        }

        var normalizedEmployeeCode = request.EmployeeCode.Trim().ToUpperInvariant();
        if (!string.Equals(normalizedEmployeeCode, profile.EmployeeCode, StringComparison.OrdinalIgnoreCase)
            && await employeeProfileRepository.ExistsByEmployeeCodeAsync(normalizedEmployeeCode, cancellationToken))
        {
            throw new InvalidOperationException("A user with this employee code already exists.");
        }

        var role = await roleRepository.GetByNameAsync(request.RoleName.Trim(), cancellationToken)
            ?? throw new InvalidOperationException("Requested role is not configured.");

        user.Email = normalizedEmail;
        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.RoleId = role.Id;
        user.Role = role;

        profile.EmployeeCode = normalizedEmployeeCode;
        profile.Department = request.Department.Trim();
        profile.JobTitle = request.JobTitle.Trim();
        profile.PhoneNumber = request.PhoneNumber.Trim();
        profile.DateOfJoining = request.DateOfJoining;

        await userRepository.UpdateAsync(user, cancellationToken);
        return MapUser(user);
    }

    public async Task<CompanyUserDto> SetEditableAsync(Guid userId, bool isEditable, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");

        user.IsEditable = isEditable;
        await userRepository.UpdateAsync(user, cancellationToken);
        return MapUser(user);
    }

    public async Task<CompanyUserDto> SetActiveAsync(Guid userId, bool isActive, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");

        user.IsActive = isActive;
        await userRepository.UpdateAsync(user, cancellationToken);
        return MapUser(user);
    }

    public async Task<CompanyUserDto> UpdateUserRoleAsync(Guid userId, UpdateUserRoleRequestDto request, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");

        var role = await roleRepository.GetByNameAsync(request.RoleName.Trim(), cancellationToken)
            ?? throw new InvalidOperationException("Requested role is not configured.");

        user.RoleId = role.Id;
        user.Role = role;

        await userRepository.UpdateAsync(user, cancellationToken);
        return MapUser(user);
    }

    private static CompanyUserDto MapUser(User user)
    {
        var assignedActivities = user.Role?.RoleActivities
            .Where(roleActivity => roleActivity.Activity is not null)
            .Select(roleActivity => roleActivity.Activity!.Name)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(name => name)
            .ToList() ?? [];

        return new CompanyUserDto
        {
            Id = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            FullName = user.FullName,
            Email = user.Email,
            EmployeeCode = user.EmployeeProfile?.EmployeeCode ?? string.Empty,
            Department = user.EmployeeProfile?.Department ?? string.Empty,
            JobTitle = user.EmployeeProfile?.JobTitle ?? string.Empty,
            PhoneNumber = user.EmployeeProfile?.PhoneNumber ?? string.Empty,
            RoleName = user.Role?.Name ?? "Employee",
            AssignedActivities = assignedActivities,
            IsActive = user.IsActive,
            IsEditable = user.IsEditable,
            DateOfJoining = user.EmployeeProfile?.DateOfJoining ?? DateOnly.FromDateTime(DateTime.UtcNow)
        };
    }
}