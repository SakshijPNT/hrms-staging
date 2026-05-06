using Hrms.Application.Interfaces.Repositories;
using Hrms.Domain.Entities;
using Hrms.Domain.Enums;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Repositories;

public sealed class AttendanceRepository(HrmsDbContext dbContext) : IAttendanceRepository
{
    public async Task<IReadOnlyList<AttendanceRecord>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.AttendanceRecords
            .Include(record => record.User)
                .ThenInclude(user => user!.EmployeeProfile)
            .OrderByDescending(record => record.WorkDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AttendanceRecord>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await dbContext.AttendanceRecords
            .Include(record => record.User)
                .ThenInclude(user => user!.EmployeeProfile)
            .Where(record => record.UserId == userId)
            .OrderByDescending(record => record.WorkDate)
            .ToListAsync(cancellationToken);
    }

    public Task<AttendanceRecord?> GetByUserIdAndDateAsync(Guid userId, DateOnly workDate, CancellationToken cancellationToken = default)
    {
        return dbContext.AttendanceRecords
            .Include(record => record.User)
                .ThenInclude(user => user!.EmployeeProfile)
            .SingleOrDefaultAsync(record => record.UserId == userId && record.WorkDate == workDate, cancellationToken);
    }

    public async Task AddAsync(AttendanceRecord record, CancellationToken cancellationToken = default)
    {
        await dbContext.AttendanceRecords.AddAsync(record, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(AttendanceRecord record, CancellationToken cancellationToken = default)
    {
        dbContext.AttendanceRecords.Update(record);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task<int> CountPresentByDateAsync(DateOnly workDate, CancellationToken cancellationToken = default)
    {
        return dbContext.AttendanceRecords.CountAsync(
            record => record.WorkDate == workDate && (record.Status == AttendanceStatus.Present || record.Status == AttendanceStatus.WorkFromHome),
            cancellationToken);
    }
}