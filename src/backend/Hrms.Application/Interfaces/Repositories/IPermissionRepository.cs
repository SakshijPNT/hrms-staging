using Hrms.Domain.Entities;

namespace Hrms.Application.Interfaces.Repositories;

public interface IPermissionRepository
{
    Task<IReadOnlyList<Permission>> GetAllWithActivityAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RolePermission>> GetByRoleIdAsync(Guid roleId, CancellationToken cancellationToken = default);
    Task AssignPermissionsToRoleAsync(Guid roleId, IReadOnlyList<Guid> permissionIds, Guid assignedBy, CancellationToken cancellationToken = default);
}
