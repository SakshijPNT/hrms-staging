using Hrms.Application.Interfaces.Repositories;
using Hrms.Domain.Entities;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Repositories;

public sealed class ActivityRepository(HrmsDbContext dbContext) : IActivityRepository
{
    public async Task<IReadOnlyList<Activity>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Activities
            .Include(activity => activity.RoleActivities)
            .OrderBy(activity => activity.Name)
            .ToListAsync(cancellationToken);
    }

    public Task<Activity?> GetByIdAsync(Guid activityId, CancellationToken cancellationToken = default)
    {
        return dbContext.Activities
            .Include(activity => activity.RoleActivities)
            .SingleOrDefaultAsync(activity => activity.Id == activityId, cancellationToken);
    }

    public async Task<IReadOnlyList<Activity>> GetByIdsAsync(IEnumerable<Guid> activityIds, CancellationToken cancellationToken = default)
    {
        var normalizedIds = activityIds.Distinct().ToArray();

        return await dbContext.Activities
            .Where(activity => normalizedIds.Contains(activity.Id))
            .OrderBy(activity => activity.Name)
            .ToListAsync(cancellationToken);
    }

    public Task<bool> ExistsAsync(string name, string code, CancellationToken cancellationToken = default)
    {
        return dbContext.Activities.AnyAsync(
            activity => activity.Name == name || activity.Code == code,
            cancellationToken);
    }

    public async Task AddAsync(Activity activity, CancellationToken cancellationToken = default)
    {
        await dbContext.Activities.AddAsync(activity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Activity activity, CancellationToken cancellationToken = default)
    {
        dbContext.Activities.Update(activity);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}