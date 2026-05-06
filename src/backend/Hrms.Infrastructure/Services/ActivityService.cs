using Hrms.Application.DTOs.Administration;
using Hrms.Application.Interfaces.Repositories;
using Hrms.Application.Interfaces.Services;
using Hrms.Domain.Entities;

namespace Hrms.Infrastructure.Services;

public sealed class ActivityService(IActivityRepository activityRepository) : IActivityService
{
    public async Task<IReadOnlyList<ActivityDto>> GetActivitiesAsync(CancellationToken cancellationToken = default)
    {
        var activities = await activityRepository.GetAllAsync(cancellationToken);
        return activities.Select(MapActivity).ToList();
    }

    public async Task<ActivityDto> CreateAsync(CreateActivityRequestDto request, CancellationToken cancellationToken = default)
    {
        var normalizedName = request.Name.Trim();
        var normalizedCode = request.Code.Trim().ToUpperInvariant().Replace(' ', '_');

        if (await activityRepository.ExistsAsync(normalizedName, normalizedCode, cancellationToken))
        {
            throw new InvalidOperationException("An activity with this name or code already exists.");
        }

        var activity = new Activity
        {
            Name = normalizedName,
            Code = normalizedCode,
            Description = request.Description.Trim(),
            Type = string.IsNullOrWhiteSpace(request.Type) ? "System" : request.Type.Trim(),
            ModuleCode = request.ModuleCode.Trim(),
            ModuleName = request.ModuleName.Trim()
        };

        await activityRepository.AddAsync(activity, cancellationToken);
        return MapActivity(activity);
    }

    public async Task<ActivityDto> UpdateAsync(Guid activityId, UpdateActivityRequestDto request, CancellationToken cancellationToken = default)
    {
        var activity = await activityRepository.GetByIdAsync(activityId, cancellationToken)
            ?? throw new InvalidOperationException("Activity not found.");

        var normalizedName = request.Name.Trim();
        var normalizedModuleName = request.ModuleName.Trim();
        var normalizedModuleCode = request.ModuleCode.Trim();
        var normalizedType = string.IsNullOrWhiteSpace(request.Type) ? "Permission" : request.Type.Trim();

        var duplicates = await activityRepository.GetAllAsync(cancellationToken);
        var duplicateName = duplicates.Any(item =>
            item.Id != activityId &&
            string.Equals(item.Name, normalizedName, StringComparison.OrdinalIgnoreCase));

        if (duplicateName)
        {
            throw new InvalidOperationException("An activity with this name already exists.");
        }

        activity.Name = normalizedName;
        activity.Description = request.Description.Trim();
        activity.Type = normalizedType;
        activity.ModuleName = normalizedModuleName;
        activity.ModuleCode = normalizedModuleCode;

        await activityRepository.UpdateAsync(activity, cancellationToken);
        return MapActivity(activity);
    }

    private static ActivityDto MapActivity(Activity activity)
    {
        return new ActivityDto
        {
            Id = activity.Id,
            Name = activity.Name,
            Code = activity.Code,
            Description = activity.Description,
            Type = activity.Type,
            ModuleCode = activity.ModuleCode,
            ModuleName = activity.ModuleName,
            AssignedRoleCount = activity.RoleActivities.Count
        };
    }
}