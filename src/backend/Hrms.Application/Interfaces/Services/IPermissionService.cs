using Hrms.Application.DTOs.Administration;

namespace Hrms.Application.Interfaces.Services;

public interface IPermissionService
{
    Task<IReadOnlyList<PermissionDto>> GetAllPermissionsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RolePermissionDto>> GetRolePermissionsAsync(Guid roleId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RolePermissionDto>> AssignPermissionsToRoleAsync(Guid roleId, AssignRolePermissionsRequestDto request, Guid assignedBy, CancellationToken cancellationToken = default);
}
