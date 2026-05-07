using Hrms.NewApi.Dtos;

namespace Hrms.NewApi.Interfaces;

public interface IAuthManager
{
    Task<SessionInfoDto> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
}
