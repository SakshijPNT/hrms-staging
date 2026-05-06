namespace Hrms.Domain.Entities;

public sealed class RoleActivity
{
    public Guid RoleId { get; set; }
    public Role? Role { get; set; }
    public Guid ActivityId { get; set; }
    public Activity? Activity { get; set; }
}