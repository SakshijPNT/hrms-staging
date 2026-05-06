namespace Hrms.Application.DTOs.Administration;

public sealed class ActivityLookupDto
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
}