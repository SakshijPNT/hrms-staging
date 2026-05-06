using Hrms.Application.DTOs.Profile;
using Hrms.Application.Interfaces.Repositories;
using Hrms.Application.Interfaces.Services;

namespace Hrms.Infrastructure.Services;

public sealed class ProfileService(IEmployeeProfileRepository employeeProfileRepository) : IProfileService
{
    public async Task<EmployeeProfileDto?> GetMyProfileAsync(Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var profile = await employeeProfileRepository.GetByUserIdAsync(currentUserId, cancellationToken);
        if (profile is null || profile.User is null)
        {
            return null;
        }

        return new EmployeeProfileDto
        {
            UserId = profile.UserId,
            FullName = profile.User.FullName,
            Email = profile.User.Email,
            Role = profile.User.Role?.Name ?? "Employee",
            EmployeeCode = profile.EmployeeCode,
            Department = profile.Department,
            JobTitle = profile.JobTitle,
            PhoneNumber = profile.PhoneNumber,
            DateOfJoining = profile.DateOfJoining
        };
    }
}