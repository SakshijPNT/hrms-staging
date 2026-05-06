using Hrms.Application.Interfaces.Repositories;
using Hrms.Domain.Entities;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Repositories;

public sealed class RoleRepository(HrmsDbContext dbContext) : IRoleRepository
{
    public Task<Role?> GetByNameAsync(string roleName, CancellationToken cancellationToken = default)
    {
        return dbContext.Roles
            .Include(role => role.RoleActivities)
            .ThenInclude(roleActivity => roleActivity.Activity)
            .SingleOrDefaultAsync(role => role.Name == roleName, cancellationToken);
    }

    public async Task<IReadOnlyList<Role>> GetAllWithActivitiesAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Roles
            .Include(role => role.RoleActivities)
            .ThenInclude(roleActivity => roleActivity.Activity)
            .OrderBy(role => role.Name)
            .ToListAsync(cancellationToken);
    }

    public Task<bool> ExistsByNameAsync(string roleName, CancellationToken cancellationToken = default)
    {
        return dbContext.Roles.AnyAsync(role => role.Name == roleName, cancellationToken);
    }

    public async Task AddAsync(Role role, CancellationToken cancellationToken = default)
    {
        await dbContext.Roles.AddAsync(role, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task<Role?> GetByIdAsync(Guid roleId, CancellationToken cancellationToken = default)
    {
        return dbContext.Roles
            .Include(role => role.RoleActivities)
            .ThenInclude(roleActivity => roleActivity.Activity)
            .SingleOrDefaultAsync(role => role.Id == roleId, cancellationToken);
    }

    public async Task UpdateAsync(Role role, CancellationToken cancellationToken = default)
    {
        dbContext.Roles.Update(role);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}