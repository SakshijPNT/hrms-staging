using Hrms.Application.DTOs.Profile;

namespace Hrms.Application.Interfaces.Services;

public interface IProfileService
{
    Task<EmployeeProfileDto?> GetMyProfileAsync(Guid currentUserId, CancellationToken cancellationToken = default);
}