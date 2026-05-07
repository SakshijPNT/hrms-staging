namespace Hrms.NewApi.Dtos;

public class SessionInfoDto
{
    public int UserId { get; set; }
    public string FullName { get; set; } = null!;
    public string EmailId { get; set; } = null!;
    public int CompanyId { get; set; }
    public string CompanyName { get; set; } = null!;
    public int RoleId { get; set; }
    public string RoleName { get; set; } = null!;
}
