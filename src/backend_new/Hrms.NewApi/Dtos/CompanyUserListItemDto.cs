namespace Hrms.NewApi.Dtos;

public class CompanyUserListItemDto
{
public int Id { get; set; }

public string FullName { get; set; } = null!;

public string EmailId { get; set; } = null!;

public int RoleId { get; set; }

public int? ManagerId { get; set; }

public string? ReportingManagerEmailId { get; set; }

public DateOnly JoiningDate { get; set; }

public int ProbationMonths { get; set; }

public DateOnly? ConfirmationDate { get; set; }

public short StatusCode { get; set; }

}

