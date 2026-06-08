using Hrms.NewApi.Data;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Hrms.NewApi.Models;
using Microsoft.EntityFrameworkCore;

namespace Hrms.NewApi.Managers;

public class PolicyManager : IPolicyManager
{
    private const string ViewAllCompaniesActivityCode = "A0";

    private readonly HrmsDbContext _dbContext;
    private readonly IHolidayManager _holidayManager;
    private readonly ILeaveTypeManager _leaveTypeManager;

    public PolicyManager(
        HrmsDbContext dbContext,
        IHolidayManager holidayManager,
        ILeaveTypeManager leaveTypeManager)
    {
        _dbContext = dbContext;
        _holidayManager = holidayManager;
        _leaveTypeManager = leaveTypeManager;
    }

    // EXISTING METHOD
    private async Task<bool> HasActivityAccessAsync(
        int userId,
        string activityCode,
        CancellationToken cancellationToken)
    {
        return await (
            from user in _dbContext.UserMasters
            join roleActivity in _dbContext.ActivityRoleMappings
                on user.RoleId equals roleActivity.RoleId
            join activity in _dbContext.ActivityMasters
                on roleActivity.ActivityId equals activity.Id
            where user.Id == userId
                  && user.StatusCode == 1
                  && roleActivity.StatusCode == 1
                  && activity.StatusCode == 1
                  && activity.ActivityCode == activityCode
            select activity.Id
        ).AnyAsync(cancellationToken);
    }

    // ADD THIS METHOD HERE
    public async Task<bool> HasPolicyAccessAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        return await HasActivityAccessAsync(
            userId,
            ViewAllCompaniesActivityCode,
            cancellationToken);
    }

    // EXISTING METHOD
    public async Task<PolicyResponseDto> CreatePolicyAsync(
    PolicyCreateDto request,
    int createdBy,
    CancellationToken cancellationToken = default)
{
    var hasAccess = await HasActivityAccessAsync(
        createdBy,
        ViewAllCompaniesActivityCode,
        cancellationToken);

    if (!hasAccess)
    {
        throw new UnauthorizedAccessException(
            "You do not have permission to create policy.");
    }

    await EnsureCompanyExistsAsync(request.CompanyId, cancellationToken);

    var now = DateTimeOffset.UtcNow;

    var policy = new CompanyPolicies
    {
        CompanyId = request.CompanyId,

        WorkHours = request.WorkHours,

        HalfDayThreshold = request.HalfdayThreshold,

        CheckInGracePeriod =
            request.CheckinGracePeriod,

        CheckOutGracePeriod =
            request.CheckoutGracePeriod,

        WorkDays = request.WorkDays,

        ShiftStart =
            TimeOnly.FromTimeSpan(
                request.ShiftStart),

        ShiftEnd =
            TimeOnly.FromTimeSpan(
                request.ShiftEnd),

        RegularizationWindowDays = request.RegularizationWindowDays > 0
            ? request.RegularizationWindowDays
            : 30,

        StatusCode = 1,

        CreatedBy = createdBy,
        CreatedOn = now,

        UpdatedBy = createdBy,
        UpdatedOn = now
    };

    _dbContext.CompanyPolicies.Add(policy);

    await _dbContext.SaveChangesAsync(
        cancellationToken);

    return new PolicyResponseDto
    {
        Id = policy.Id,

        CompanyId = policy.CompanyId,

        WorkHours = policy.WorkHours,

        HalfdayThreshold =
            policy.HalfDayThreshold,

        CheckinGracePeriod =
            policy.CheckInGracePeriod,

        CheckoutGracePeriod =
            policy.CheckOutGracePeriod,

        WorkDays = policy.WorkDays,

        ShiftStart =
            policy.ShiftStart.ToTimeSpan(),

        ShiftEnd =
            policy.ShiftEnd.ToTimeSpan(),

        RegularizationWindowDays = policy.RegularizationWindowDays,
    };
}

public async Task<IReadOnlyList<PolicyResponseDto>> GetPoliciesAsync(int loggedInUserCompanyId,int loggedInUserRoleId,CancellationToken cancellationToken = default)
{
    var canViewAllPolicies = await (
        from activityRoleMapping in _dbContext.ActivityRoleMappings
        join activity in _dbContext.ActivityMasters
            on activityRoleMapping.ActivityId equals activity.Id
        where activityRoleMapping.RoleId == loggedInUserRoleId
              && activityRoleMapping.StatusCode == 1
              && activity.StatusCode == 1
              && activity.ActivityCode == ViewAllCompaniesActivityCode
        select activity.Id
    ).AnyAsync(cancellationToken);

    var query =
        _dbContext.CompanyPolicies
            .AsNoTracking();

    if (!canViewAllPolicies)
    {
        query = query.Where(
            x => x.CompanyId == loggedInUserCompanyId);
    }

    return await query
        .OrderBy(x => x.CompanyId)
        .Select(x => new PolicyResponseDto
        {
            Id = x.Id,
            CompanyId = x.CompanyId,
            WorkHours = x.WorkHours,
            HalfdayThreshold = x.HalfDayThreshold,
            CheckinGracePeriod = x.CheckInGracePeriod,
            CheckoutGracePeriod = x.CheckOutGracePeriod,
            WorkDays = x.WorkDays,
            ShiftStart =
                x.ShiftStart.ToTimeSpan(),
            ShiftEnd =
                x.ShiftEnd.ToTimeSpan(),
            RegularizationWindowDays = x.RegularizationWindowDays,
        })
        .ToListAsync(cancellationToken);
}


public async Task<PolicyResponseDto> UpdatePolicyAsync(PolicyUpdateDto request,int updatedBy,CancellationToken cancellationToken = default)
{
    var hasAccess = await HasActivityAccessAsync(
        updatedBy,
        ViewAllCompaniesActivityCode,
        cancellationToken);

    if (!hasAccess)
    {
        throw new UnauthorizedAccessException(
            "You do not have permission to edit policy.");
    }

    var policy = await _dbContext.CompanyPolicies
        .FirstOrDefaultAsync(
            x => x.Id == request.Id,
            cancellationToken);

    if (policy == null)
    {
        throw new KeyNotFoundException(
            "Policy not found.");
    }

    await EnsureCompanyExistsAsync(request.CompanyId, cancellationToken);

    policy.CompanyId = request.CompanyId;

    policy.WorkHours = request.WorkHours;

    policy.HalfDayThreshold =
        request.HalfdayThreshold;

    policy.CheckInGracePeriod =
        request.CheckinGracePeriod;

    policy.CheckOutGracePeriod =
        request.CheckoutGracePeriod;

    policy.WorkDays =
        request.WorkDays;

    policy.ShiftStart =
        TimeOnly.FromTimeSpan(
            request.ShiftStart);

    policy.ShiftEnd =
        TimeOnly.FromTimeSpan(
            request.ShiftEnd);

    policy.RegularizationWindowDays = request.RegularizationWindowDays > 0
        ? request.RegularizationWindowDays
        : 30;

    policy.UpdatedBy = updatedBy;

    policy.UpdatedOn =
        DateTimeOffset.UtcNow;

    await _dbContext.SaveChangesAsync(
        cancellationToken);

    return new PolicyResponseDto
    {
        Id = policy.Id,
        CompanyId = policy.CompanyId,
        WorkHours = policy.WorkHours,
        HalfdayThreshold = policy.HalfDayThreshold,
        CheckinGracePeriod = policy.CheckInGracePeriod,
        CheckoutGracePeriod = policy.CheckOutGracePeriod,
        WorkDays = policy.WorkDays,
        ShiftStart = policy.ShiftStart.ToTimeSpan(),
        ShiftEnd = policy.ShiftEnd.ToTimeSpan(),
        RegularizationWindowDays = policy.RegularizationWindowDays,
    };
}

public async Task<PolicySetupResponseDto> CreatePolicySetupAsync(
    PolicySetupCreateDto request,
    int createdBy,
    CancellationToken cancellationToken = default)
{
    await using var transaction =
        await _dbContext.Database.BeginTransactionAsync(cancellationToken);

    try
    {
        var policy = await CreatePolicyAsync(
            request.Policy,
            createdBy,
            cancellationToken);

        await _holidayManager.SyncHolidaysAsync(
            request.Policy.CompanyId,
            request.HolidayYear,
            request.Holidays,
            createdBy,
            cancellationToken);

        await _leaveTypeManager.SyncLeaveTypesAsync(
            request.Policy.CompanyId,
            request.LeaveTypes,
            createdBy,
            cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        return new PolicySetupResponseDto
        {
            Policy = policy,
            Message = "Policy setup saved successfully.",
        };
    }
    catch
    {
        await transaction.RollbackAsync(cancellationToken);
        throw;
    }
}

public async Task<PolicySetupResponseDto> UpdatePolicySetupAsync(
    PolicySetupUpdateDto request,
    int updatedBy,
    CancellationToken cancellationToken = default)
{
    await using var transaction =
        await _dbContext.Database.BeginTransactionAsync(cancellationToken);

    try
    {
        var policy = await UpdatePolicyAsync(
            request.Policy,
            updatedBy,
            cancellationToken);

        await _holidayManager.SyncHolidaysAsync(
            request.Policy.CompanyId,
            request.HolidayYear,
            request.Holidays,
            updatedBy,
            cancellationToken);

        await _leaveTypeManager.SyncLeaveTypesAsync(
            request.Policy.CompanyId,
            request.LeaveTypes,
            updatedBy,
            cancellationToken);

        await transaction.CommitAsync(cancellationToken);

        return new PolicySetupResponseDto
        {
            Policy = policy,
            Message = "Policy setup updated successfully.",
        };
    }
    catch
    {
        await transaction.RollbackAsync(cancellationToken);
        throw;
    }
}

public async Task<PolicyCompanyContextDto> GetCompanyContextAsync(
    int companyId,
    CancellationToken cancellationToken = default)
{
    var company = await _dbContext.CompanyMasters
        .AsNoTracking()
        .Where(x => x.Id == companyId)
        .Select(x => new PolicyCompanyContextDto
        {
            CompanyId = x.Id,
            CompanyName = x.CompanyName,
            Timezone = x.Timezone,
        })
        .FirstOrDefaultAsync(cancellationToken)
        ?? throw new KeyNotFoundException($"Company with id {companyId} was not found.");

    return company;
}

private async Task EnsureCompanyExistsAsync(
    int companyId,
    CancellationToken cancellationToken)
{
    var exists = await _dbContext.CompanyMasters
        .AnyAsync(x => x.Id == companyId, cancellationToken);

    if (!exists)
    {
        throw new InvalidOperationException(
            $"Company with id {companyId} was not found. Create the company first or use a valid Company Id.");
    }
}

}