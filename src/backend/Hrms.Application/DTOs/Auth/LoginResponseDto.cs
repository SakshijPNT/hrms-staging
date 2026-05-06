namespace Hrms.Application.DTOs.Auth;

public sealed class LoginResponseDto
{
    public string Token { get; init; } = string.Empty;
    public DateTime ExpiresAtUtc { get; init; }
    public AuthenticatedUserDto User { get; init; } = new();
}