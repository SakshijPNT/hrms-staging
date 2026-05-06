using Hrms.Application.DTOs.Requests;

namespace Hrms.Application.Interfaces.Services;

public interface IRequestService
{
    Task<IReadOnlyList<RequestDto>> GetRequestsAsync(Guid currentUserId, bool hasElevatedAccess, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RequestDto>> GetMyRequestsAsync(Guid currentUserId, CancellationToken cancellationToken = default);
    Task<RequestDto> CreateAsync(Guid currentUserId, CreateRequestDto request, CancellationToken cancellationToken = default);
}