namespace Hrms.NewApi.Dtos;

public class UserLeaveApplicationListItemDto
{
    public int Id { get; set; }
    public int LeaveTypeId { get; set; }
    public string LeaveTypeName { get; set; } = null!;
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public decimal TotalDays { get; set; }
    public bool IsHalfDay { get; set; }
    public string? Session { get; set; }
    public string? Reason { get; set; }
    public string ApprovalStatus { get; set; } = null!;
    public int? ApprovedBy { get; set; }
    public string? ApproverEmailId { get; set; }
    public DateTimeOffset? ApprovedOn { get; set; }
    public string? ApproverRemark { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
}
