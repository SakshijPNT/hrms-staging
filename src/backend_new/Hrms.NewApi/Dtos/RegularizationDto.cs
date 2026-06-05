using System.ComponentModel.DataAnnotations;

namespace Hrms.NewApi.Dtos;

public class CreateRegularizationDto
{
    [Required]
    public DateOnly LogDate { get; set; }

    /// <summary>Company-local time on LogDate (e.g. 09:00).</summary>
    [Required]
    public TimeOnly RequestedCheckInTime { get; set; }

    [Required]
    public TimeOnly RequestedCheckOutTime { get; set; }

    [Required]
    [MaxLength(500)]
    public string Reason { get; set; } = null!;
}

public class RegularizationPreviewDto
{
    public DateOnly LogDate { get; set; }
    public DateTimeOffset? OriginalCheckInTime { get; set; }
    public DateTimeOffset? OriginalCheckOutTime { get; set; }
    public int? AttendanceLogId { get; set; }
    public bool CanSubmit { get; set; }
    public string? BlockReason { get; set; }
}

public class RegularizationListItemDto
{
    public int Id { get; set; }
    public DateOnly LogDate { get; set; }
    public DateTimeOffset? OriginalCheckInTime { get; set; }
    public DateTimeOffset? OriginalCheckOutTime { get; set; }
    public DateTimeOffset RequestedCheckInTime { get; set; }
    public DateTimeOffset RequestedCheckOutTime { get; set; }
    public string Reason { get; set; } = null!;
    public string ApprovalStatus { get; set; } = null!;
    public int? ApprovedBy { get; set; }
    public string? ApproverEmailId { get; set; }
    public DateTimeOffset? ApprovedOn { get; set; }
    public string? ApproverRemark { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
}

public class ManagerRegularizationListItemDto : RegularizationListItemDto
{
    public int UserId { get; set; }
    public string EmployeeName { get; set; } = null!;
    public string EmployeeEmail { get; set; } = null!;
}

public class ReviewRegularizationDto
{
    [MaxLength(500)]
    public string? ApproverRemark { get; set; }
}
