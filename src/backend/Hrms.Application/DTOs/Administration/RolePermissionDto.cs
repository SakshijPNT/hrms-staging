namespace Hrms.Application.DTOs.Administration;

public sealed class RolePermissionDto
{
    public Guid Id { get; init; }
    public Guid RoleId { get; init; }
    public Guid PermissionId { get; init; }
    public string PermissionName { get; init; } = string.Empty;
    public string PermissionType { get; init; } = string.Empty;
    public string ActivityName { get; init; } = string.Empty;
    public string ActivityCode { get; init; } = string.Empty;
}
