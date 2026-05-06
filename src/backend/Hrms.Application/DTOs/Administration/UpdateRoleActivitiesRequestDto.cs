namespace Hrms.Application.DTOs.Administration;

public sealed class UpdateRoleActivitiesRequestDto
{
    public IReadOnlyList<Guid> ActivityIds { get; set; } = [];
}
