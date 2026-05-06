using Hrms.Application.DTOs.Administration;
using Hrms.Application.Interfaces.Repositories;
using Hrms.Application.Interfaces.Services;

namespace Hrms.Infrastructure.Services;

public sealed class PermissionService(IPermissionRepository permissionRepository) : IPermissionService
{
    public async Task<IReadOnlyList<PermissionDto>> GetAllPermissionsAsync(CancellationToken cancellationToken = default)
    {
        var permissions = await permissionRepository.GetAllWithActivityAsync(cancellationToken);

        return permissions.Select(p => new PermissionDto
        {
            Id = p.Id,
            ActivityId = p.ActivityId,
            ActivityName = p.Activity?.Name ?? string.Empty,
            ActivityCode = p.Activity?.Code ?? string.Empty,
            PermissionName = p.PermissionName,
            PermissionType = p.PermissionType,
        }).ToList();
    }

    public async Task<IReadOnlyList<RolePermissionDto>> GetRolePermissionsAsync(Guid roleId, CancellationToken cancellationToken = default)
    {
        var rolePermissions = await permissionRepository.GetByRoleIdAsync(roleId, cancellationToken);

        return rolePermissions.Select(rp => new RolePermissionDto
        {
            Id = rp.Id,
            RoleId = rp.RoleId,
            PermissionId = rp.PermissionId,
            PermissionName = rp.Permission?.PermissionName ?? string.Empty,
            PermissionType = rp.Permission?.PermissionType ?? string.Empty,
            ActivityName = rp.Permission?.Activity?.Name ?? string.Empty,
            ActivityCode = rp.Permission?.Activity?.Code ?? string.Empty,
        }).ToList();
    }

    public async Task<IReadOnlyList<RolePermissionDto>> AssignPermissionsToRoleAsync(
        Guid roleId,
        AssignRolePermissionsRequestDto request,
        Guid assignedBy,
        CancellationToken cancellationToken = default)
    {
        await permissionRepository.AssignPermissionsToRoleAsync(roleId, request.PermissionIds, assignedBy, cancellationToken);
        return await GetRolePermissionsAsync(roleId, cancellationToken);
    }
}
