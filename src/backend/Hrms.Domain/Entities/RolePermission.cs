using Hrms.Domain.Common;

namespace Hrms.Domain.Entities;

public sealed class RolePermission : BaseEntity
{
    public Guid RoleId { get; set; }
    public Role? Role { get; set; }
    public Guid PermissionId { get; set; }
    public Permission? Permission { get; set; }
    public Guid AssignedBy { get; set; }
    public User? AssignedByUser { get; set; }
}
