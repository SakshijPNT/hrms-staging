using Hrms.Domain.Entities;
using Hrms.Domain.Enums;

namespace Hrms.Application.Interfaces.Repositories;

public interface IRequestRepository
{
    Task<IReadOnlyList<EmployeeRequest>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EmployeeRequest>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<EmployeeRequest>> GetRecentAsync(int take, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<int> CountByStatusAsync(RequestStatus status, CancellationToken cancellationToken = default);
    Task AddAsync(EmployeeRequest request, CancellationToken cancellationToken = default);
}