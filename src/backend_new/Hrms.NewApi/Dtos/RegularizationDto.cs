using System.ComponentModel.DataAnnotations;



namespace Hrms.NewApi.Dtos;



public class CreateRegularizationDto

{

    [Required]

    public DateOnly LogDate { get; set; }



    [Required]

    [MaxLength(30)]

    public string RequestedCorrectionType { get; set; } = null!;



    [Required]

    [MaxLength(500)]

    public string Reason { get; set; } = null!;



    /// <summary>HH:mm or HH:mm:ss — required for forgot check-in/out.</summary>

    [MaxLength(10)]

    public string? RequestedCheckInTime { get; set; }



    /// <summary>HH:mm or HH:mm:ss — required for forgot check-in/out.</summary>

    [MaxLength(10)]

    public string? RequestedCheckOutTime { get; set; }

}



public class RegularizationPreviewDto

{

    public DateOnly LogDate { get; set; }

    public int? AttendanceLogId { get; set; }

    public string? OriginalAttendanceStatus { get; set; }

    public DateTimeOffset? OriginalCheckInTime { get; set; }

    public DateTimeOffset? OriginalCheckOutTime { get; set; }

    public int? WorkedMinutes { get; set; }

    public bool CanSubmit { get; set; }

    public string? BlockReason { get; set; }

    public IReadOnlyList<string> AllowedCorrectionTypes { get; set; } = Array.Empty<string>();

}



public class RegularizationListItemDto

{

    public int Id { get; set; }

    public DateOnly LogDate { get; set; }

    public string OriginalAttendanceStatus { get; set; } = null!;

    public string RequestedCorrectionType { get; set; } = null!;

    public DateTimeOffset? OriginalCheckInTime { get; set; }

    public DateTimeOffset? OriginalCheckOutTime { get; set; }

    public DateTimeOffset? RequestedCheckInTime { get; set; }

    public DateTimeOffset? RequestedCheckOutTime { get; set; }

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


