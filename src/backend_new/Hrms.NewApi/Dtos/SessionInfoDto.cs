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

public class LoginResponseDto
{
    public List<ModuleDto> Modules { get; set; } = [];
    public List<ActivityDto> Activities { get; set; } = [];
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
