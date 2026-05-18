using System.ComponentModel.DataAnnotations;

namespace Hrms.Application.DTOs.Auth;

public sealed class LoginRequestDto
{
    [Required, EmailAddress]
    public string EmailId { get; init; } = string.Empty;

    [Required, MinLength(8)]
    public string Password { get; init; } = string.Empty;
}