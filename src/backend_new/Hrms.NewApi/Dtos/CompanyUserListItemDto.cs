namespace Hrms.NewApi.Dtos;

public class CompanyUserListItemDto
{
    public string FullName { get; set; } = null!;
    public string EmailId { get; set; } = null!;
    public string? ReportingManagerEmailId { get; set; }
    public DateOnly JoiningDate { get; set; }
}
