using Hrms.Application.DTOs.Administration;

namespace Hrms.Application.Interfaces.Services;

public interface IActivityService
{
    Task<IReadOnlyList<ActivityDto>> GetActivitiesAsync(CancellationToken cancellationToken = default);
    Task<ActivityDto> CreateAsync(CreateActivityRequestDto request, CancellationToken cancellationToken = default);
    Task<ActivityDto> UpdateAsync(Guid activityId, UpdateActivityRequestDto request, CancellationToken cancellationToken = default);
}