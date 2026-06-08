namespace Hrms.NewApi.Dtos;

public class LeaveTypeResponseDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string LeaveTypeName { get; set; } = null!;
    public string? Description { get; set; }
    public decimal MaxDaysAllowed { get; set; }
    public bool IsCarryForward { get; set; }
    public decimal? MaxCarryForward { get; set; }
}

public class LeaveTypeSyncItemDto
{
    public int? Id { get; set; }
    public string LeaveTypeName { get; set; } = null!;
    public string? Description { get; set; }
    public decimal MaxDaysAllowed { get; set; }
    public bool IsCarryForward { get; set; }
    public decimal? MaxCarryForward { get; set; }
}
