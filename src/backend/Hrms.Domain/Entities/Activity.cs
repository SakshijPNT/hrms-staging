using Hrms.Domain.Common;

namespace Hrms.Domain.Entities;

public sealed class Activity : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = "System";
    public string ModuleCode { get; set; } = string.Empty;
    public string ModuleName { get; set; } = string.Empty;
    public ICollection<RoleActivity> RoleActivities { get; set; } = new List<RoleActivity>();
}