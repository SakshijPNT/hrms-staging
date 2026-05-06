using Hrms.Domain.Common;
using System.ComponentModel.DataAnnotations.Schema;

namespace Hrms.Domain.Entities;

public sealed class Permission : BaseEntity
{
    public Guid ActivityId { get; set; }
    public Activity? Activity { get; set; }
    public string PermissionName { get; set; } = string.Empty; // e.g., REQUEST_VIEW
    public string PermissionType { get; set; } = string.Empty; // View/Edit
}
