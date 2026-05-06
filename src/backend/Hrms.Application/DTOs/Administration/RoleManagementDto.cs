namespace Hrms.Application.DTOs.Administration;

public sealed class RoleManagementDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public IReadOnlyList<ActivityLookupDto> Activities { get; init; } = [];
}