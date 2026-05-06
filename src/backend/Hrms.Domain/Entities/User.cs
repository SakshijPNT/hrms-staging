using Hrms.Domain.Common;

namespace Hrms.Domain.Entities;

public sealed class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public bool IsEditable { get; set; } = false;
    public Guid RoleId { get; set; }
    public Role? Role { get; set; }
    public EmployeeProfile? EmployeeProfile { get; set; }
    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();
    public ICollection<EmployeeRequest> Requests { get; set; } = new List<EmployeeRequest>();

    public string FullName => $"{FirstName} {LastName}".Trim();
}