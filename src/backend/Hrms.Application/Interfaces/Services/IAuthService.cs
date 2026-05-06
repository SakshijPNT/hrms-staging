using Hrms.Application.DTOs.Auth;

namespace Hrms.Application.Interfaces.Services;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
    Task<LoginResponseDto> RegisterAsync(RegisterUserRequestDto request, CancellationToken cancellationToken = default);
}