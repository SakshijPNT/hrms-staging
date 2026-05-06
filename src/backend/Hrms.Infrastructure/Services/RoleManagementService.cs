using Hrms.Application.DTOs.Administration;
using Hrms.Application.Interfaces.Repositories;
using Hrms.Application.Interfaces.Services;
using Hrms.Domain.Entities;

namespace Hrms.Infrastructure.Services;

public sealed class RoleManagementService(
    IRoleRepository roleRepository,
    IActivityRepository activityRepository) : IRoleManagementService
{
    public async Task<IReadOnlyList<RoleManagementDto>> GetRolesAsync(CancellationToken cancellationToken = default)
    {
        var roles = await roleRepository.GetAllWithActivitiesAsync(cancellationToken);
        return roles.Select(MapRole).ToList();
    }

    public async Task<RoleManagementDto> CreateAsync(CreateRoleRequestDto request, CancellationToken cancellationToken = default)
    {
        var normalizedName = request.Name.Trim();
        if (await roleRepository.ExistsByNameAsync(normalizedName, cancellationToken))
        {
            throw new InvalidOperationException("A role with this name already exists.");
        }

        var activities = await activityRepository.GetByIdsAsync(request.ActivityIds, cancellationToken);
        if (activities.Count == 0)
        {
            throw new InvalidOperationException("Select at least one valid activity for the role.");
        }

        var role = new Role
        {
            Name = normalizedName,
            Description = request.Description.Trim(),
            RoleActivities = activities
                .Select(activity => new RoleActivity
                {
                    RoleId = Guid.Empty,
                    ActivityId = activity.Id,
                    Activity = activity
                })
                .ToList()
        };

        foreach (var roleActivity in role.RoleActivities)
        {
            roleActivity.RoleId = role.Id;
        }

        await roleRepository.AddAsync(role, cancellationToken);
        return MapRole(role);
    }

    public async Task<RoleManagementDto> UpdateRoleActivitiesAsync(Guid roleId, UpdateRoleActivitiesRequestDto request, CancellationToken cancellationToken = default)
    {
        var role = await roleRepository.GetByIdAsync(roleId, cancellationToken)
            ?? throw new InvalidOperationException("Role not found.");

        if (request.ActivityIds.Count == 0)
        {
            throw new InvalidOperationException("Assign at least one activity to the role.");
        }

        var activities = await activityRepository.GetByIdsAsync(request.ActivityIds.ToList(), cancellationToken);
        if (activities.Count == 0)
        {
            throw new InvalidOperationException("Select at least one valid activity for the role.");
        }

        role.RoleActivities.Clear();
        foreach (var activity in activities)
        {
            role.RoleActivities.Add(new RoleActivity
            {
                RoleId = role.Id,
                ActivityId = activity.Id,
                Activity = activity
            });
        }

        await roleRepository.UpdateAsync(role, cancellationToken);
        return MapRole(role);
    }

    private static RoleManagementDto MapRole(Role role)
    {
        return new RoleManagementDto
        {
            Id = role.Id,
            Name = role.Name,
            Description = role.Description,
            Activities = role.RoleActivities
                .Where(roleActivity => roleActivity.Activity is not null)
                .Select(roleActivity => new ActivityLookupDto
                {
                    Id = roleActivity.ActivityId,
                    Name = roleActivity.Activity!.Name,
                    Code = roleActivity.Activity.Code
                })
                .OrderBy(activity => activity.Name)
                .ToList()
        };
    }
}