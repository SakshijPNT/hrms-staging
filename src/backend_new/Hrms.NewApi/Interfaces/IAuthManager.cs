using Hrms.NewApi.Dtos;

namespace Hrms.NewApi.Interfaces;

public interface IAuthManager
{
    Task<(SessionInfoDto Session, LoginResponseDto Response)> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
}
