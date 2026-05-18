namespace Hrms.Application.DTOs.Administration;

public sealed class CompanyUserDto
{
    public Guid Id { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string EmailId { get; init; } = string.Empty;
    public string EmployeeCode { get; init; } = string.Empty;
    public string Department { get; init; } = string.Empty;
    public string JobTitle { get; init; } = string.Empty;
    public string PhoneNumber { get; init; } = string.Empty;
    public string RoleName { get; init; } = string.Empty;
    public IReadOnlyList<string> AssignedActivities { get; init; } = [];
    public bool IsActive { get; init; }
    public bool IsEditable { get; init; }
    public DateOnly DateOfJoining { get; init; }
}