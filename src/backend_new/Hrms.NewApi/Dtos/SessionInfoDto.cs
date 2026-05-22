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

    public string Timezone { get; set; } = "Asia/Kolkata"; //default
}

public class LoginResponseDto
{
    public List<ModuleGroupDto> Groups { get; set; } = new();

    public List<ActivityDto> Activities { get; set; } = new();
}

public class ModuleDto
{
    public int Id { get; set; }
    public string ModuleName { get; set; } = null!;
    public string? Description { get; set; }
    public string? IconUrl { get; set; }
}

public class ActivityDto
{
    public int Id { get; set; }
    public string ActivityCode { get; set; } = null!;
    public string ActivityName { get; set; } = null!;
    public string Description { get; set; } = null!;
}
