using Hrms.NewApi.Dtos;

namespace Hrms.NewApi.Interfaces;

public interface IAuthManager
{
    //Task<(SessionInfoDto Session, LoginResponseDto Response)> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
Task<SessionInfoDto> LoginAsync(LoginRequestDto request,CancellationToken cancellationToken = default);

Task<LoginResponseDto> GetSessionDataAsync(int userId,CancellationToken cancellationToken = default);

    Task<SessionInfoDto> RefreshSessionFromCompanyAsync(
        SessionInfoDto session,
        CancellationToken cancellationToken = default);
}
