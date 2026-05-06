namespace Hrms.Application.DTOs.Auth;

public sealed class AuthenticatedUserDto
{
    public Guid Id { get; init; }
    public string Email { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public string EmployeeCode { get; init; } = string.Empty;
    public IReadOnlyList<string> AssignedActivityCodes { get; init; } = [];
    public DateOnly? DateOfJoining { get; init; }
}