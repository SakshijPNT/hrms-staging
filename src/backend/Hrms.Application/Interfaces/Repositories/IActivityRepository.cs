using Hrms.Domain.Entities;

namespace Hrms.Application.Interfaces.Repositories;

public interface IActivityRepository
{
    Task<IReadOnlyList<Activity>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<Activity?> GetByIdAsync(Guid activityId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Activity>> GetByIdsAsync(IEnumerable<Guid> activityIds, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(string name, string code, CancellationToken cancellationToken = default);
    Task AddAsync(Activity activity, CancellationToken cancellationToken = default);
    Task UpdateAsync(Activity activity, CancellationToken cancellationToken = default);
}