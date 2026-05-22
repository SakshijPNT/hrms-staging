namespace Hrms.NewApi.Dtos;
public class ModuleItemDto
{
    public int Id { get; set; }

    public string ModuleName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string? IconUrl { get; set; }
}