using System.ComponentModel.DataAnnotations;

namespace Hrms.NewApi.Dtos;

public class ReviewLeaveApplicationDto
{
    [MaxLength(500)]
    public string? ApproverRemark { get; set; }
}
