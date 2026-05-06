using System.ComponentModel.DataAnnotations;

namespace Hrms.Application.DTOs.Administration;

public sealed class CreateCompanyUserRequestDto
{
    [Required, EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    public string FirstName { get; init; } = string.Empty;

    [Required]
    public string LastName { get; init; } = string.Empty;

    [Required]
    public string Department { get; init; } = string.Empty;

    [Required]
    public string JobTitle { get; init; } = string.Empty;

    public string PhoneNumber { get; init; } = string.Empty;

    public DateOnly DateOfJoining { get; init; } = DateOnly.FromDateTime(DateTime.UtcNow);

    public string RoleName { get; init; } = "Employee";
}