namespace Hrms.NewApi.Dtos;

public class UserResponseDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = null!;
    public string EmailId { get; set; } = null!;
    public int? ManagerId { get; set; }
    public int CompanyId { get; set; }
    public int RoleId { get; set; }
    public DateOnly JoiningDate { get; set; }
    public int ProbationMonths { get; set; }
    public DateOnly? ConfirmationDate { get; set; }
    public short StatusCode { get; set; }
    public DateTimeOffset CreatedOn { get; set; }
    public DateTimeOffset UpdatedOn { get; set; }
}
