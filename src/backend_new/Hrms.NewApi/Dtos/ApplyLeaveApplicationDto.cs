using System.ComponentModel.DataAnnotations;

namespace Hrms.NewApi.Dtos;

public class ApplyLeaveApplicationDto
{
    [Required]
    public int LeaveTypeId { get; set; }

    [Required]
    public DateOnly FromDate { get; set; }

    [Required]
    public DateOnly ToDate { get; set; }

    public bool IsHalfDay { get; set; }

    [MaxLength(20)]
    public string? Session { get; set; }

    [MaxLength(500)]
    public string? Reason { get; set; }
}
