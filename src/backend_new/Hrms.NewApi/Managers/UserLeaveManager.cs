using Hrms.NewApi.Data;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Hrms.NewApi.Models;
using Microsoft.EntityFrameworkCore;

namespace Hrms.NewApi.Managers;

public class UserLeaveManager : IUserLeaveManager
{
    private readonly HrmsDbContext _dbContext;

    public UserLeaveManager(HrmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<UserLeaveApplicationListItemDto> ApplyLeaveAsync(
        int userId,
        int companyId,
        ApplyLeaveApplicationDto request,
        CancellationToken cancellationToken = default)
    {
        ValidateLeaveRequestShape(request);

        var leaveTypeName = await _dbContext.LeaveTypeMasters
            .AsNoTracking()
            .Where(x => x.Id == request.LeaveTypeId && x.CompanyId == companyId && x.StatusCode == 1)
            .Select(x => x.LeaveTypeName)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new InvalidOperationException($"Leave type with id {request.LeaveTypeId} does not exist for this company.");

        var hasPendingOverlap = await _dbContext.LeaveApplications.AnyAsync(
            x => x.UserId == userId
                && x.StatusCode == 1
                && x.ApprovalStatus == "PENDING"
                && x.FromDate <= request.ToDate
                && x.ToDate >= request.FromDate,
            cancellationToken);
        if (hasPendingOverlap)
        {
            throw new InvalidOperationException("A leave application is already pending for the same day.");
        }

        var requestedDates = GetDateRange(request.FromDate, request.ToDate).ToList();
        await ValidateWorkingDaysAsync(companyId, requestedDates, cancellationToken);

        var totalDays = request.IsHalfDay ? 0.5m : requestedDates.Count;
        await ValidateLeaveBalanceAsync(userId, request.LeaveTypeId, request.FromDate.Year, totalDays, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var leaveApplication = new LeaveApplication
        {
            UserId = userId,
            LeaveTypeId = request.LeaveTypeId,
            FromDate = request.FromDate,
            ToDate = request.ToDate,
            TotalDays = totalDays,
            IsHalfDay = request.IsHalfDay,
            Session = request.IsHalfDay ? NormalizeSession(request.Session) : null,
            Reason = request.Reason,
            ApprovalStatus = "PENDING",
            StatusCode = 1,
            CreatedBy = userId,
            UpdatedBy = userId,
            CreatedOn = now,
            UpdatedOn = now,
        };

        _dbContext.LeaveApplications.Add(leaveApplication);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapLeaveApplication(leaveApplication, leaveTypeName, approverEmailId: null);
    }

    public async Task<IReadOnlyList<UserLeaveApplicationListItemDto>> GetLeaveApplicationsForUserAsync(int userId,CancellationToken cancellationToken = default)
    {
        return await (
            from leaveApplication in _dbContext.LeaveApplications.AsNoTracking()
            where leaveApplication.UserId == userId && leaveApplication.StatusCode == 1
            join leaveType in _dbContext.LeaveTypeMasters.AsNoTracking()
                on leaveApplication.LeaveTypeId equals leaveType.Id
            join approver in _dbContext.UserMasters.AsNoTracking()
                on leaveApplication.ApprovedBy equals approver.Id into approvers
            from approver in approvers.DefaultIfEmpty()
            orderby leaveApplication.CreatedOn descending
            select new UserLeaveApplicationListItemDto
            {
                Id = leaveApplication.Id,
                LeaveTypeName = leaveType.LeaveTypeName,
                FromDate = leaveApplication.FromDate,
                ToDate = leaveApplication.ToDate,
                TotalDays = leaveApplication.TotalDays,
                IsHalfDay = leaveApplication.IsHalfDay,
                Session = leaveApplication.Session,
                Reason = leaveApplication.Reason,
                ApprovalStatus = leaveApplication.ApprovalStatus,
                ApprovedBy = leaveApplication.ApprovedBy,
                ApproverEmailId = approver == null ? null : approver.EmailId,
                ApprovedOn = leaveApplication.ApprovedOn,
                ApproverRemark = leaveApplication.ApproverRemark,
                CreatedOn = leaveApplication.CreatedOn,
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<UserLeaveApplicationListItemDto> CancelLeaveAsync(int leaveId,int userId,CancellationToken cancellationToken = default)
    {
        var leave = await _dbContext.LeaveApplications
            .FirstOrDefaultAsync(x => x.Id == leaveId && x.StatusCode == 1, cancellationToken)
            ?? throw new KeyNotFoundException($"Leave application {leaveId} was not found.");

        if (leave.UserId != userId)
            throw new UnauthorizedAccessException("You can only cancel your own leave applications.");

        if (leave.ApprovalStatus is "CANCELLED" or "REJECTED")
            throw new InvalidOperationException($"Leave cannot be cancelled because it is already {leave.ApprovalStatus.ToLower()}.");

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (leave.FromDate <= today)
            throw new InvalidOperationException("Leave cannot be cancelled once the leave date has arrived or passed.");

        leave.ApprovalStatus = "CANCELLED";
        leave.UpdatedBy = userId;
        leave.UpdatedOn = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        var leaveTypeName = await _dbContext.LeaveTypeMasters
            .AsNoTracking()
            .Where(x => x.Id == leave.LeaveTypeId)
            .Select(x => x.LeaveTypeName)
            .FirstAsync(cancellationToken);

        return MapLeaveApplication(leave, leaveTypeName, approverEmailId: null);
    }

    private static void ValidateLeaveRequestShape(ApplyLeaveApplicationDto request)
    {
        if (request.ToDate < request.FromDate)
        {
            throw new InvalidOperationException("Leave to date cannot be before from date.");
        }

        if (request.FromDate.Year != request.ToDate.Year)
        {
            throw new InvalidOperationException("Leave application cannot span multiple leave cycle years.");
        }

        if (request.IsHalfDay && request.FromDate != request.ToDate)
        {
            throw new InvalidOperationException("Half-day leave can be applied for one date only.");
        }

        if (request.IsHalfDay)
        {
            _ = NormalizeSession(request.Session);
        }
    }

    private async Task ValidateWorkingDaysAsync(int  companyId,IReadOnlyList<DateOnly> requestedDates,CancellationToken cancellationToken)
    {
        var workDaysText = await _dbContext.CompanyPolicies
            .AsNoTracking()
            .Where(x => x.CompanyId == companyId && x.StatusCode == 1)
            .Select(x => x.WorkDays)
            .FirstOrDefaultAsync(cancellationToken)
            ?? "MON,TUE,WED,THU,FRI";

        var workDays = ParseWorkDays(workDaysText);
        var weekOff = requestedDates.FirstOrDefault(x => !workDays.Contains(x.DayOfWeek));
        if (weekOff != default)
        {
            throw new InvalidOperationException($"Leave cannot be applied on a week-off: {weekOff:yyyy-MM-dd}.");
        }

        var fromDate = requestedDates.Min();
        var toDate = requestedDates.Max();
        var holiday = await _dbContext.HolidayLists
            .AsNoTracking()
            .Where(x => x.CompanyId == companyId
                && x.StatusCode == 1
                && x.HolidayDate >= fromDate
                && x.HolidayDate <= toDate)
            .OrderBy(x => x.HolidayDate)
            .Select(x => new { x.HolidayDate, x.HolidayName })
            .FirstOrDefaultAsync(cancellationToken);

        if (holiday is not null)
        {
            throw new InvalidOperationException($"Leave cannot be applied on company holiday {holiday.HolidayName} ({holiday.HolidayDate:yyyy-MM-dd}).");
        }
    }

    public async Task<IEnumerable<UserLeaveBalanceDTO>> GetUserLeaveBalances (int userId,int companyId,CancellationToken cancellationToken)
    {
        return await (  
            from balance in _dbContext.UserLeaveBalances.AsNoTracking()
            where balance.UserId == userId && balance.StatusCode == 1
            join leaveType in _dbContext.LeaveTypeMasters.AsNoTracking()
                on balance.LeaveTypeId equals leaveType.Id
            where leaveType.CompanyId == companyId && leaveType.StatusCode == 1
            select new UserLeaveBalanceDTO
            {
                LeaveTypeId = balance.LeaveTypeId,
                LeaveTypeName = leaveType.LeaveTypeName,
                AvailableBalance = balance.AvailableBalance,
            })
            .ToListAsync(cancellationToken);
    }

    private async Task ValidateLeaveBalanceAsync(
        int userId,
        int leaveTypeId,
        int cycleYear,
        decimal totalDays,
        CancellationToken cancellationToken)
    {
        var availableBalance = await _dbContext.UserLeaveBalances
            .AsNoTracking()
            .Where(x => x.UserId == userId
                && x.LeaveTypeId == leaveTypeId
                && x.CycleYear == cycleYear
                && x.StatusCode == 1)
            .Select(x => (decimal?)x.AvailableBalance)
            .FirstOrDefaultAsync(cancellationToken);

        if (!availableBalance.HasValue || availableBalance.Value <= 0)
        {
            throw new InvalidOperationException("You do not have any leave balance for this leave type.");
        }

        if (availableBalance.Value < totalDays)
        {
            throw new InvalidOperationException("You do not have enough leave balance for this application.");
        }
    }

    private static IReadOnlySet<DayOfWeek> ParseWorkDays(string workDays)
    {
        var parsed = workDays
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(x => x.ToUpperInvariant())
            .Select(x => x.Length >= 3 ? x[..3] : x)
            .Select(x => x switch
            {
                "SUN" => DayOfWeek.Sunday,
                "MON" => DayOfWeek.Monday,
                "TUE" => DayOfWeek.Tuesday,
                "WED" => DayOfWeek.Wednesday,
                "THU" => DayOfWeek.Thursday,
                "FRI" => DayOfWeek.Friday,
                "SAT" => DayOfWeek.Saturday,
                _ => (DayOfWeek?)null,
            })
            .Where(x => x.HasValue)
            .Select(x => x!.Value)
            .ToHashSet();

        return parsed.Count == 0
            ? new HashSet<DayOfWeek>
            {
                DayOfWeek.Monday,
                DayOfWeek.Tuesday,
                DayOfWeek.Wednesday,
                DayOfWeek.Thursday,
                DayOfWeek.Friday,
            }
            : parsed;
    }

    private static IEnumerable<DateOnly> GetDateRange(DateOnly fromDate, DateOnly toDate)
    {
        for (var date = fromDate; date <= toDate; date = date.AddDays(1))
        {
            yield return date;
        }
    }

    private static string NormalizeSession(string? session)
    {
        var normalized = session?.Trim().ToUpperInvariant();
        if (normalized is "FIRST_HALF" or "SECOND_HALF")
        {
            return normalized;
        }

        throw new InvalidOperationException("Session is required for half-day leave and must be FIRST_HALF or SECOND_HALF.");
    }

    private static UserLeaveApplicationListItemDto MapLeaveApplication(
        LeaveApplication leaveApplication,
        string leaveTypeName,
        string? approverEmailId)
    {
        return new UserLeaveApplicationListItemDto
        {
            Id = leaveApplication.Id,
            LeaveTypeName = leaveTypeName,
            FromDate = leaveApplication.FromDate,
            ToDate = leaveApplication.ToDate,
            TotalDays = leaveApplication.TotalDays,
            IsHalfDay = leaveApplication.IsHalfDay,
            Session = leaveApplication.Session,
            Reason = leaveApplication.Reason,
            ApprovalStatus = leaveApplication.ApprovalStatus,
            ApprovedBy = leaveApplication.ApprovedBy,
            ApproverEmailId = approverEmailId,
            ApprovedOn = leaveApplication.ApprovedOn,
            ApproverRemark = leaveApplication.ApproverRemark,
            CreatedOn = leaveApplication.CreatedOn,
        };
    }

    public async Task<IEnumerable<LeaveTypeDropdownDto>>GetLeaveTypesAsync(int companyId,CancellationToken cancellationToken = default)
{
        return await _dbContext.LeaveTypeMasters.AsNoTracking()
        .Where(x =>
            x.CompanyId == companyId &&
            x.StatusCode == 1)
        .Select(x => new LeaveTypeDropdownDto
        {
            Id = x.Id,
            LeaveTypeName = x.LeaveTypeName
        })
        .ToListAsync(cancellationToken);
}
}
