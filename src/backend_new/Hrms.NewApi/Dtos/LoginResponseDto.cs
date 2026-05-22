namespace Hrms.NewApi.Dtos;

public class LoginResponseDto
{
    public List<ModuleGroupDto> Groups { get; set; } = new();

    public List<ActivityDto> Activities { get; set; } = new();
}