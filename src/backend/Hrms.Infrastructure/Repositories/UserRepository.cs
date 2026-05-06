using Hrms.Application.Interfaces.Repositories;
using Hrms.Domain.Entities;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Repositories;

public sealed class UserRepository(HrmsDbContext dbContext) : IUserRepository
{
    public async Task<IReadOnlyList<User>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Users
            .Include(user => user.Role)
            .ThenInclude(role => role!.RoleActivities)
            .ThenInclude(roleActivity => roleActivity.Activity)
            .Include(user => user.EmployeeProfile)
            .OrderBy(user => user.FirstName)
            .ThenBy(user => user.LastName)
            .ToListAsync(cancellationToken);
    }

    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return dbContext.Users
            .Include(user => user.Role)
            .ThenInclude(role => role!.RoleActivities)
            .ThenInclude(roleActivity => roleActivity.Activity)
            .Include(user => user.EmployeeProfile)
            .SingleOrDefaultAsync(user => user.Email == email, cancellationToken);
    }

    public Task<User?> GetByIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return dbContext.Users
            .Include(user => user.Role)
            .ThenInclude(role => role!.RoleActivities)
            .ThenInclude(roleActivity => roleActivity.Activity)
            .Include(user => user.EmployeeProfile)
            .SingleOrDefaultAsync(user => user.Id == userId, cancellationToken);
    }

    public Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return dbContext.Users.AnyAsync(user => user.Email == email, cancellationToken);
    }

    public Task<int> CountAsync(CancellationToken cancellationToken = default)
    {
        return dbContext.Users.CountAsync(user => user.IsActive, cancellationToken);
    }

    public async Task AddAsync(User user, CancellationToken cancellationToken = default)
    {
        await dbContext.Users.AddAsync(user, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        dbContext.Users.Update(user);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}