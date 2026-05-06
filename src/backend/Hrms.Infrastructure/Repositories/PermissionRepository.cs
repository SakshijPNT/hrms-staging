using Hrms.Application.Interfaces.Repositories;
using Hrms.Domain.Entities;
using Hrms.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.Infrastructure.Repositories;

public sealed class PermissionRepository(HrmsDbContext dbContext) : IPermissionRepository
{
    public async Task<IReadOnlyList<Permission>> GetAllWithActivityAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.Permissions
            .Include(p => p.Activity)
            .OrderBy(p => p.PermissionName)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<RolePermission>> GetByRoleIdAsync(Guid roleId, CancellationToken cancellationToken = default)
    {
        return await dbContext.RolePermissions
            .Include(rp => rp.Permission)
                .ThenInclude(p => p!.Activity)
            .Where(rp => rp.RoleId == roleId)
            .ToListAsync(cancellationToken);
    }

    public async Task AssignPermissionsToRoleAsync(Guid roleId, IReadOnlyList<Guid> permissionIds, Guid assignedBy, CancellationToken cancellationToken = default)
    {
        // Remove existing assignments for this role
        var existing = await dbContext.RolePermissions
            .Where(rp => rp.RoleId == roleId)
            .ToListAsync(cancellationToken);

        dbContext.RolePermissions.RemoveRange(existing);

        // Add new assignments
        var newAssignments = permissionIds.Select(pid => new RolePermission
        {
            Id = Guid.NewGuid(),
            RoleId = roleId,
            PermissionId = pid,
            AssignedBy = assignedBy,
            CreatedUtc = DateTime.UtcNow,
        });

        await dbContext.RolePermissions.AddRangeAsync(newAssignments, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
