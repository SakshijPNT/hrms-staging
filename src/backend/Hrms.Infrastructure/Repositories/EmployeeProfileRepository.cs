using Hrms.Application.Interfaces.Repositories;
using Hrms.Domain.Entities;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Repositories;

public sealed class EmployeeProfileRepository(HrmsDbContext dbContext) : IEmployeeProfileRepository
{
    public Task<EmployeeProfile?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return dbContext.EmployeeProfiles
            .Include(profile => profile.User)
                .ThenInclude(user => user!.Role)
            .SingleOrDefaultAsync(profile => profile.UserId == userId, cancellationToken);
    }

    public async Task AddAsync(EmployeeProfile profile, CancellationToken cancellationToken = default)
    {
        await dbContext.EmployeeProfiles.AddAsync(profile, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task<bool> ExistsByEmployeeCodeAsync(string employeeCode, CancellationToken cancellationToken = default)
    {
        return dbContext.EmployeeProfiles.AnyAsync(
            profile => profile.EmployeeCode == employeeCode,
            cancellationToken);
    }

    public async Task<int> GetNextCodeNumberAsync(CancellationToken cancellationToken = default)
    {
        const string prefix = "PNT-EMP-";
        var codes = await dbContext.EmployeeProfiles
            .Where(p => p.EmployeeCode.StartsWith(prefix))
            .Select(p => p.EmployeeCode)
            .ToListAsync(cancellationToken);

        var maxNumber = codes
            .Select(code => int.TryParse(code[prefix.Length..], out var n) ? n : 0)
            .DefaultIfEmpty(0)
            .Max();

        return maxNumber + 1;
    }
}