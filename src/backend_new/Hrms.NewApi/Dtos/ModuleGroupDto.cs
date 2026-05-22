namespace Hrms.NewApi.Dtos;
public class ModuleGroupDto
{
    public int GroupId { get; set; }

    public string GroupName { get; set; } = string.Empty;

    public List<ModuleItemDto> Modules { get; set; } = new();
}