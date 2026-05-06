using Hrms.Domain.Common;

namespace Hrms.Domain.Entities;

public sealed class Role : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<RoleActivity> RoleActivities { get; set; } = new List<RoleActivity>();
}