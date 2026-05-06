using Hrms.Domain.Entities;

namespace Hrms.Application.Interfaces.Repositories;

public interface IAttendanceRepository
{
    Task<IReadOnlyList<AttendanceRecord>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AttendanceRecord>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<AttendanceRecord?> GetByUserIdAndDateAsync(Guid userId, DateOnly workDate, CancellationToken cancellationToken = default);
    Task AddAsync(AttendanceRecord record, CancellationToken cancellationToken = default);
    Task UpdateAsync(AttendanceRecord record, CancellationToken cancellationToken = default);
    Task<int> CountPresentByDateAsync(DateOnly workDate, CancellationToken cancellationToken = default);
}