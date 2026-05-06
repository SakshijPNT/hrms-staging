using Hrms.Domain.Common;

namespace Hrms.Domain.Entities;

public sealed class UserPermission : BaseEntity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public Guid PermissionId { get; set; }
    public Permission? Permission { get; set; }
    public Guid AssignedBy { get; set; }
    public User? AssignedByUser { get; set; }
}
