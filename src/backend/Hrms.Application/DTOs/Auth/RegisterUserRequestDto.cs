using System.ComponentModel.DataAnnotations;

namespace Hrms.Application.DTOs.Auth;

public sealed class RegisterUserRequestDto
{
    [Required, EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required, MinLength(8)]
    public string Password { get; init; } = string.Empty;

    [Required]
    public string FirstName { get; init; } = string.Empty;

    [Required]
    public string LastName { get; init; } = string.Empty;

    [Required]
    public string EmployeeCode { get; init; } = string.Empty;

    public string Department { get; init; } = "Operations";
    public string JobTitle { get; init; } = "Associate";
    public string PhoneNumber { get; init; } = string.Empty;
    public DateOnly DateOfJoining { get; init; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public string RoleName { get; init; } = "Employee";
}