namespace Hrms.NewApi.Dtos;

public class TeamMemberListItemDto
{
    public int Id { get; set; }

    public string FullName { get; set; } = null!;

    public string EmailId { get; set; } = null!;

    public int RoleId { get; set; }

    public string RoleName { get; set; } = null!;

    public int? ManagerId { get; set; }

    public string? ManagerName { get; set; }

    public DateOnly JoiningDate { get; set; }

    public int ProbationMonths { get; set; }

    public DateOnly? ConfirmationDate { get; set; }

    public short StatusCode { get; set; }
}
