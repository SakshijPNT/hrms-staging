namespace Hrms.Application.DTOs.Administration;

/// <summary>
/// Sent by admin when saving permission assignments for a role.
/// permissionIds: list of Permission IDs to assign (replaces existing).
/// </summary>
public sealed class AssignRolePermissionsRequestDto
{
    public IReadOnlyList<Guid> PermissionIds { get; init; } = [];
}
