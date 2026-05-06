using Hrms.Domain.Common;

namespace Hrms.Domain.Entities;

public sealed class EmployeeProfile : BaseEntity
{
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public DateOnly DateOfJoining { get; set; }
}