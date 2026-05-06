using Hrms.Domain.Entities;

namespace Hrms.Application.Interfaces.Repositories;

public interface IRoleRepository
{
    Task<Role?> GetByNameAsync(string roleName, CancellationToken cancellationToken = default);
    Task<Role?> GetByIdAsync(Guid roleId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Role>> GetAllWithActivitiesAsync(CancellationToken cancellationToken = default);
    Task<bool> ExistsByNameAsync(string roleName, CancellationToken cancellationToken = default);
    Task AddAsync(Role role, CancellationToken cancellationToken = default);
    Task UpdateAsync(Role role, CancellationToken cancellationToken = default);
}