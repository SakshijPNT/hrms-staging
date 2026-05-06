using Hrms.Application.Interfaces.Repositories;
using Hrms.Domain.Entities;
using Hrms.Domain.Enums;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Repositories;

public sealed class RequestRepository(HrmsDbContext dbContext) : IRequestRepository
{
    public async Task<IReadOnlyList<EmployeeRequest>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Requests
            .Include(request => request.User)
            .OrderByDescending(request => request.SubmittedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<EmployeeRequest>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Requests
            .Include(request => request.User)
            .Where(request => request.UserId == userId)
            .OrderByDescending(request => request.SubmittedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<EmployeeRequest>> GetRecentAsync(int take, Guid? userId = null, CancellationToken cancellationToken = default)
    {
        var query = dbContext.Requests
            .Include(request => request.User)
            .OrderByDescending(request => request.SubmittedAtUtc)
            .AsQueryable();

        if (userId.HasValue)
        {
            query = query.Where(request => request.UserId == userId.Value);
        }

        return await query.Take(take).ToListAsync(cancellationToken);
    }

    public Task<int> CountByStatusAsync(RequestStatus status, CancellationToken cancellationToken = default)
    {
        return dbContext.Requests.CountAsync(request => request.Status == status, cancellationToken);
    }

    public async Task AddAsync(EmployeeRequest request, CancellationToken cancellationToken = default)
    {
        await dbContext.Requests.AddAsync(request, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}