using Hrms.Domain.Entities;

namespace Hrms.Application.Interfaces.Repositories;

public interface IEmployeeProfileRepository
{
    Task<EmployeeProfile?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> ExistsByEmployeeCodeAsync(string employeeCode, CancellationToken cancellationToken = default);
    Task<int> GetNextCodeNumberAsync(CancellationToken cancellationToken = default);
    Task AddAsync(EmployeeProfile profile, CancellationToken cancellationToken = default);
}