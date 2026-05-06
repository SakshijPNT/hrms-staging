using Hrms.Application.DTOs.Administration;

namespace Hrms.Application.Interfaces.Services;

public interface IRoleManagementService
{
    Task<IReadOnlyList<RoleManagementDto>> GetRolesAsync(CancellationToken cancellationToken = default);
    Task<RoleManagementDto> CreateAsync(CreateRoleRequestDto request, CancellationToken cancellationToken = default);
    Task<RoleManagementDto> UpdateRoleActivitiesAsync(Guid roleId, UpdateRoleActivitiesRequestDto request, CancellationToken cancellationToken = default);
}