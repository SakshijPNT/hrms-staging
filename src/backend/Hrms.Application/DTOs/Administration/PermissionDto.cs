namespace Hrms.Application.DTOs.Administration;

public sealed class PermissionDto
{
    public Guid Id { get; init; }
    public Guid ActivityId { get; init; }
    public string ActivityName { get; init; } = string.Empty;
    public string ActivityCode { get; init; } = string.Empty;
    public string PermissionName { get; init; } = string.Empty;
    public string PermissionType { get; init; } = string.Empty; // View / Edit
}
