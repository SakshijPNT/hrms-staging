using Hrms.NewApi.Data;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Hrms.NewApi.Models;
using Hrms.NewApi.Support;
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

        var hasPendingOverlap = await HasPendingLeaveOverlapAsync(
            userId,
            request.FromDate,
            request.ToDate,
            excludeLeaveId: null,
            cancellationToken);
        if (hasPendingOverlap)
        {
            throw new InvalidOperationException("A leave application is already pending for the same day.");
        }

        var requestedDates = GetDateRange(request.FromDate, request.ToDate).ToList();
        await ValidateWorkingDaysAsync(companyId, requestedDates, cancellationToken);

        var totalDays = request.IsHalfDay ? 0.5m : requestedDates.Count;

        var company = await _dbContext.CompanyMasters
            .AsNoTracking()
            .Where(x => x.Id == companyId && x.StatusCode == 1)
            .Select(x => new
            {
                x.Timezone,
                x.FiscalYearStartMonth,
                x.FiscalYearStartDay,
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new InvalidOperationException("Company not found.");

        var companyToday = FiscalYearHelper.GetCompanyToday(company.Timezone);
        var fiscalCycleYear = FiscalYearHelper.GetFiscalCycleStartYear(
            companyToday,
            company.FiscalYearStartMonth,
            company.FiscalYearStartDay);

        await ValidateLeaveBalanceAsync(
            userId,
            request.LeaveTypeId,
            fiscalCycleYear,
            totalDays,
            cancellationToken);

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

    public async Task<LeaveApplicationMonthlyPreviewDto> PreviewLeaveApplicationMonthlyAsync(
        int userId,
        int companyId,
        ApplyLeaveApplicationDto request,
        int? excludeLeaveId = null,
        CancellationToken cancellationToken = default)
    {
        ValidateLeaveRequestShape(request);

        var requestedDates = GetDateRange(request.FromDate, request.ToDate).ToList();
        await ValidateWorkingDaysAsync(companyId, requestedDates, cancellationToken);

        var totalDays = request.IsHalfDay ? 0.5m : requestedDates.Count;

        var company = await _dbContext.CompanyMasters
            .AsNoTracking()
            .Where(x => x.Id == companyId && x.StatusCode == 1)
            .Select(x => new { x.Timezone, x.FiscalYearStartMonth, x.FiscalYearStartDay })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new InvalidOperationException("Company not found.");

        var companyToday = FiscalYearHelper.GetCompanyToday(company.Timezone);
        var fiscalCycleYear = FiscalYearHelper.GetFiscalCycleStartYear(
            companyToday,
            company.FiscalYearStartMonth,
            company.FiscalYearStartDay);

        var balance = await _dbContext.UserLeaveBalances
            .FirstOrDefaultAsync(
                x => x.UserId == userId
                    && x.LeaveTypeId == request.LeaveTypeId
                    && x.CycleYear == fiscalCycleYear
                    && x.StatusCode == 1,
                cancellationToken);

        if (balance == null)
        {
            return new LeaveApplicationMonthlyPreviewDto
            {
                TotalDays = totalDays,
                MonthlyAvailable = 0m,
                ExceedsMonthlyLimit = false,
                ExcessDays = 0m,
            };
        }

        await EnsureMonthlyAllocationAsync(balance, cancellationToken);

        if (IsSameCalendarMonth(request.FromDate, companyToday))
        {
            await SyncMonthlyBalanceAsync(
                balance,
                company.Timezone,
                companyToday,
                cancellationToken);
        }

        var approvedInMonth = await GetApprovedDaysInLeaveMonthAsync(
            userId,
            request.LeaveTypeId,
            request.FromDate,
            cancellationToken);

        var pendingInMonth = await GetPendingDaysInLeaveMonthAsync(
            userId,
            request.LeaveTypeId,
            request.FromDate,
            excludeLeaveId,
            cancellationToken);

        var monthlyRemaining = IsSameCalendarMonth(request.FromDate, companyToday)
            ? balance.MonthlyPending - pendingInMonth
            : balance.MonthlyAllocation
                + balance.MonthlyCarryForward
                - approvedInMonth
                - pendingInMonth;

        var excessDays = CalculateMonthlyExcessForWarning(totalDays, monthlyRemaining);

        string? warningMessage = null;
        if (excessDays > 0)
        {
            var excessLabel = FormatLeaveDays(excessDays);
            warningMessage =
                $"You are requesting {FormatLeaveDays(totalDays)} but only {FormatLeaveDays(Math.Max(0m, monthlyRemaining))} remain in this month's leave quota. The additional {excessLabel} will be deducted from next month's leave balance.";
        }

        return new LeaveApplicationMonthlyPreviewDto
        {
            TotalDays = totalDays,
            MonthlyAvailable = Math.Max(0m, monthlyRemaining),
            ExceedsMonthlyLimit = excessDays > 0,
            ExcessDays = excessDays,
            WarningMessage = warningMessage,
        };
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
                LeaveTypeId = leaveApplication.LeaveTypeId,
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

    public async Task<UserLeaveApplicationListItemDto> UpdateLeaveApplicationAsync(
        int leaveId,
        int userId,
        int companyId,
        ApplyLeaveApplicationDto request,
        CancellationToken cancellationToken = default)
    {
        ValidateLeaveRequestShape(request);

        var leave = await LoadOwnedPendingLeaveForModifyAsync(
            leaveId,
            userId,
            cancellationToken);

        var leaveTypeName = await _dbContext.LeaveTypeMasters
            .AsNoTracking()
            .Where(x => x.Id == request.LeaveTypeId && x.CompanyId == companyId && x.StatusCode == 1)
            .Select(x => x.LeaveTypeName)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new InvalidOperationException($"Leave type with id {request.LeaveTypeId} does not exist for this company.");

        if (await HasPendingLeaveOverlapAsync(
                userId,
                request.FromDate,
                request.ToDate,
                excludeLeaveId: leaveId,
                cancellationToken))
        {
            throw new InvalidOperationException("A leave application is already pending for the same day.");
        }

        var requestedDates = GetDateRange(request.FromDate, request.ToDate).ToList();
        await ValidateWorkingDaysAsync(companyId, requestedDates, cancellationToken);

        var totalDays = request.IsHalfDay ? 0.5m : requestedDates.Count;

        var company = await _dbContext.CompanyMasters
            .AsNoTracking()
            .Where(x => x.Id == companyId && x.StatusCode == 1)
            .Select(x => new
            {
                x.Timezone,
                x.FiscalYearStartMonth,
                x.FiscalYearStartDay,
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new InvalidOperationException("Company not found.");

        var companyToday = FiscalYearHelper.GetCompanyToday(company.Timezone);
        var fiscalCycleYear = FiscalYearHelper.GetFiscalCycleStartYear(
            companyToday,
            company.FiscalYearStartMonth,
            company.FiscalYearStartDay);

        await ValidateLeaveBalanceAsync(
            userId,
            request.LeaveTypeId,
            fiscalCycleYear,
            totalDays,
            cancellationToken);

        leave.LeaveTypeId = request.LeaveTypeId;
        leave.FromDate = request.FromDate;
        leave.ToDate = request.ToDate;
        leave.TotalDays = totalDays;
        leave.IsHalfDay = request.IsHalfDay;
        leave.Session = request.IsHalfDay ? NormalizeSession(request.Session) : null;
        leave.Reason = request.Reason;
        leave.UpdatedBy = userId;
        leave.UpdatedOn = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapLeaveApplication(leave, leaveTypeName, approverEmailId: null);
    }

    public async Task DeleteLeaveApplicationAsync(
        int leaveId,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var leave = await LoadOwnedPendingLeaveForModifyAsync(
            leaveId,
            userId,
            cancellationToken);

        leave.StatusCode = 0;
        leave.UpdatedBy = userId;
        leave.UpdatedOn = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ManagerLeaveApplicationListItemDto>> GetPendingLeaveApplicationsForManagerAsync(
        int managerId,
        int companyId,
        CancellationToken cancellationToken = default)
    {
        return await (
            from leaveApplication in _dbContext.LeaveApplications.AsNoTracking()
            join employee in _dbContext.UserMasters.AsNoTracking()
                on leaveApplication.UserId equals employee.Id
            join leaveType in _dbContext.LeaveTypeMasters.AsNoTracking()
                on leaveApplication.LeaveTypeId equals leaveType.Id
            join approver in _dbContext.UserMasters.AsNoTracking()
                on leaveApplication.ApprovedBy equals approver.Id into approvers
            from approver in approvers.DefaultIfEmpty()
            where leaveApplication.StatusCode == 1
                && employee.CompanyId == companyId
                && employee.ManagerId == managerId
                && employee.StatusCode == 1
            orderby leaveApplication.CreatedOn descending
            select new ManagerLeaveApplicationListItemDto
            {
                Id = leaveApplication.Id,
                UserId = leaveApplication.UserId,
                UserName = employee.FullName,
                LeaveTypeId = leaveApplication.LeaveTypeId,
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

    public async Task<ManagerLeaveApplicationListItemDto> ApproveLeaveAsync(
        int id,
        int approverId,
        int companyId,
        ReviewLeaveApplicationDto request,
        CancellationToken cancellationToken = default)
    {
        var entity = await LoadPendingForManagerReviewAsync(
            id,
            approverId,
            companyId,
            cancellationToken);

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            await DeductLeaveBalanceOnApprovalAsync(
                entity.UserId,
                entity.LeaveTypeId,
                entity.FromDate,
                entity.TotalDays,
                companyId,
                approverId,
                cancellationToken);

            var now = DateTimeOffset.UtcNow;

            entity.ApprovalStatus = "APPROVED";
            entity.ApprovedBy = approverId;
            entity.ApprovedOn = now;
            entity.ApproverRemark = request.ApproverRemark?.Trim();
            entity.UpdatedBy = approverId;
            entity.UpdatedOn = now;

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }

        return await MapManagerLeaveApplicationAsync(entity.Id, cancellationToken);
    }

    public async Task<ManagerLeaveApplicationListItemDto> RejectLeaveAsync(
        int id,
        int approverId,
        int companyId,
        ReviewLeaveApplicationDto request,
        CancellationToken cancellationToken = default)
    {
        var entity = await LoadPendingForManagerReviewAsync(
            id,
            approverId,
            companyId,
            cancellationToken);

        var now = DateTimeOffset.UtcNow;

        entity.ApprovalStatus = "REJECTED";
        entity.ApprovedBy = approverId;
        entity.ApprovedOn = now;
        entity.ApproverRemark = request.ApproverRemark?.Trim();
        entity.UpdatedBy = approverId;
        entity.UpdatedOn = now;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await MapManagerLeaveApplicationAsync(entity.Id, cancellationToken);
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

    public async Task<IEnumerable<UserLeaveBalanceDTO>> GetUserLeaveBalances(
        int userId,
        int companyId,
        CancellationToken cancellationToken)
    {
        var company = await _dbContext.CompanyMasters
            .AsNoTracking()
            .Where(x => x.Id == companyId && x.StatusCode == 1)
            .Select(x => new
            {
                x.Timezone,
                x.FiscalYearStartMonth,
                x.FiscalYearStartDay,
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new InvalidOperationException("Company not found.");

        var companyToday = FiscalYearHelper.GetCompanyToday(company.Timezone);
        var fiscalCycleYear = FiscalYearHelper.GetFiscalCycleStartYear(
            companyToday,
            company.FiscalYearStartMonth,
            company.FiscalYearStartDay);

        return await (
            from leaveType in _dbContext.LeaveTypeMasters.AsNoTracking()
            where leaveType.CompanyId == companyId && leaveType.StatusCode == 1
            join balance in _dbContext.UserLeaveBalances.AsNoTracking()
                .Where(x =>
                    x.UserId == userId
                    && x.CycleYear == fiscalCycleYear
                    && x.StatusCode == 1)
                on leaveType.Id equals balance.LeaveTypeId into balances
            from balance in balances.DefaultIfEmpty()
            orderby leaveType.LeaveTypeName
            select new UserLeaveBalanceDTO
            {
                LeaveTypeId = leaveType.Id,
                LeaveTypeName = leaveType.LeaveTypeName,
                TotalAnnual = leaveType.MaxDaysAllowed,
                MonthlyLeave = balance != null
                    ? balance.MonthlyAllocation
                    : FiscalYearHelper.CalculateMonthlyAllocation(leaveType.MaxDaysAllowed),
                Used = balance != null ? balance.TakenDays : 0m,
                Pending = balance != null
                    ? balance.AvailableBalance
                    : leaveType.MaxDaysAllowed,
                AvailableBalance = balance != null
                    ? balance.AvailableBalance
                    : leaveType.MaxDaysAllowed,
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<UserLeaveBalanceDetailDto> GetUserLeaveBalanceDetailAsync(
        int userId,
        int companyId,
        int leaveTypeId,
        CancellationToken cancellationToken = default)
    {
        var leaveType = await _dbContext.LeaveTypeMasters
            .AsNoTracking()
            .Where(x => x.Id == leaveTypeId && x.CompanyId == companyId && x.StatusCode == 1)
            .Select(x => new
            {
                x.Id,
                x.LeaveTypeName,
                x.MaxDaysAllowed,
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new KeyNotFoundException($"Leave type with id {leaveTypeId} was not found.");

        var company = await _dbContext.CompanyMasters
            .AsNoTracking()
            .Where(x => x.Id == companyId && x.StatusCode == 1)
            .Select(x => new
            {
                x.Timezone,
                x.FiscalYearStartMonth,
                x.FiscalYearStartDay,
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new InvalidOperationException("Company not found.");

        var companyToday = FiscalYearHelper.GetCompanyToday(company.Timezone);
        var fiscalCycleYear = FiscalYearHelper.GetFiscalCycleStartYear(
            companyToday,
            company.FiscalYearStartMonth,
            company.FiscalYearStartDay);

        var balance = await _dbContext.UserLeaveBalances
            .AsNoTracking()
            .Where(x =>
                x.UserId == userId
                && x.LeaveTypeId == leaveTypeId
                && x.CycleYear == fiscalCycleYear
                && x.StatusCode == 1)
            .Select(x => new
            {
                x.TakenDays,
                x.AvailableBalance,
                x.MonthlyUsed,
                x.MonthlyPending,
            })
            .FirstOrDefaultAsync(cancellationToken);

        var monthlyAllocation = FiscalYearHelper.CalculateMonthlyAllocation(
            leaveType.MaxDaysAllowed);

        return new UserLeaveBalanceDetailDto
        {
            LeaveTypeId = leaveType.Id,
            LeaveTypeName = leaveType.LeaveTypeName,
            AnnualUsed = balance?.TakenDays ?? 0m,
            AnnualPending = balance?.AvailableBalance ?? leaveType.MaxDaysAllowed,
            MonthlyUsed = balance?.MonthlyUsed ?? 0m,
            MonthlyPending = balance?.MonthlyPending ?? monthlyAllocation,
        };
    }

    public async Task InitializeLeaveBalancesForUserAsync(
        int userId,
        int companyId,
        int createdBy,
        CancellationToken cancellationToken = default)
    {
        var company = await _dbContext.CompanyMasters
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == companyId && x.StatusCode == 1,
                cancellationToken)
            ?? throw new InvalidOperationException($"Company with id {companyId} does not exist.");

        var leaveTypes = await _dbContext.LeaveTypeMasters
            .AsNoTracking()
            .Where(x => x.CompanyId == companyId && x.StatusCode == 1)
            .ToListAsync(cancellationToken);

        if (leaveTypes.Count == 0)
        {
            return;
        }

        var companyToday = FiscalYearHelper.GetCompanyToday(company.Timezone);
        var fiscalCycleYear = FiscalYearHelper.GetFiscalCycleStartYear(
            companyToday,
            company.FiscalYearStartMonth,
            company.FiscalYearStartDay);

        var existingLeaveTypeIds = await _dbContext.UserLeaveBalances
            .AsNoTracking()
            .Where(x =>
                x.UserId == userId
                && x.CycleYear == fiscalCycleYear)
            .Select(x => x.LeaveTypeId)
            .ToListAsync(cancellationToken);

        var existingSet = existingLeaveTypeIds.ToHashSet();
        var now = DateTimeOffset.UtcNow;

        foreach (var leaveType in leaveTypes)
        {
            if (existingSet.Contains(leaveType.Id))
            {
                continue;
            }

            var monthlyAllocation = FiscalYearHelper.CalculateMonthlyAllocation(
                leaveType.MaxDaysAllowed);

            _dbContext.UserLeaveBalances.Add(new UserLeaveBalance
            {
                UserId = userId,
                LeaveTypeId = leaveType.Id,
                CycleYear = fiscalCycleYear,
                OpeningBalance = 0m,
                CreditedDays = leaveType.MaxDaysAllowed,
                TakenDays = 0m,
                AvailableBalance = leaveType.MaxDaysAllowed,
                MonthlyAllocation = monthlyAllocation,
                MonthlyUsed = 0m,
                MonthlyPending = monthlyAllocation,
                MonthlyCarryForward = 0m,
                FiscalYearCarryForwardIn = 0m,
                LastProcessedMonth = null,
                StatusCode = 1,
                CreatedBy = createdBy,
                UpdatedBy = createdBy,
                CreatedOn = now,
                UpdatedOn = now,
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private async Task ValidateLeaveBalanceAsync(
        int userId,
        int leaveTypeId,
        short cycleYear,
        decimal totalDays,
        CancellationToken cancellationToken)
    {
        var balance = await _dbContext.UserLeaveBalances
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.UserId == userId
                    && x.LeaveTypeId == leaveTypeId
                    && x.CycleYear == cycleYear
                    && x.StatusCode == 1,
                cancellationToken);

        if (balance == null)
        {
            throw new InvalidOperationException(
                "You do not have any leave balance for this leave type.");
        }

        if (balance.AvailableBalance <= 0)
        {
            throw new InvalidOperationException(
                "You do not have any leave balance for this leave type.");
        }

        if (balance.AvailableBalance < totalDays)
        {
            throw new InvalidOperationException(
                "You do not have enough leave balance for this application.");
        }
    }

    private async Task<decimal> GetApprovedDaysInLeaveMonthAsync(
        int userId,
        int leaveTypeId,
        DateOnly leaveFromDate,
        CancellationToken cancellationToken)
    {
        var monthStart = new DateOnly(leaveFromDate.Year, leaveFromDate.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);

        return await _dbContext.LeaveApplications
            .AsNoTracking()
            .Where(x =>
                x.UserId == userId
                && x.LeaveTypeId == leaveTypeId
                && x.StatusCode == 1
                && x.ApprovalStatus == "APPROVED"
                && x.FromDate >= monthStart
                && x.FromDate <= monthEnd)
            .SumAsync(x => x.TotalDays, cancellationToken);
    }

    private async Task<decimal> GetPendingDaysInLeaveMonthAsync(
        int userId,
        int leaveTypeId,
        DateOnly leaveFromDate,
        int? excludeLeaveId,
        CancellationToken cancellationToken)
    {
        var monthStart = new DateOnly(leaveFromDate.Year, leaveFromDate.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);

        var query = _dbContext.LeaveApplications
            .AsNoTracking()
            .Where(x =>
                x.UserId == userId
                && x.LeaveTypeId == leaveTypeId
                && x.StatusCode == 1
                && x.ApprovalStatus == "PENDING"
                && x.FromDate >= monthStart
                && x.FromDate <= monthEnd);

        if (excludeLeaveId.HasValue)
        {
            query = query.Where(x => x.Id != excludeLeaveId.Value);
        }

        return await query.SumAsync(x => x.TotalDays, cancellationToken);
    }

    private async Task EnsureMonthlyAllocationAsync(
        UserLeaveBalance balance,
        CancellationToken cancellationToken)
    {
        if (balance.MonthlyAllocation > 0)
        {
            return;
        }

        var maxDaysAllowed = await _dbContext.LeaveTypeMasters
            .AsNoTracking()
            .Where(x => x.Id == balance.LeaveTypeId && x.StatusCode == 1)
            .Select(x => (decimal?)x.MaxDaysAllowed)
            .FirstOrDefaultAsync(cancellationToken);

        if (maxDaysAllowed.HasValue)
        {
            balance.MonthlyAllocation = FiscalYearHelper.CalculateMonthlyAllocation(
                maxDaysAllowed.Value);
        }
    }

    private async Task SyncMonthlyBalanceAsync(
        UserLeaveBalance balance,
        string? companyTimezone,
        DateOnly currentMonth,
        CancellationToken cancellationToken)
    {
        await EnsureMonthlyAllocationAsync(balance, cancellationToken);

        if (balance.MonthlyAllocation <= 0)
        {
            balance.MonthlyUsed = 0m;
            balance.MonthlyPending = 0m;
            return;
        }

        var monthStart = new DateOnly(currentMonth.Year, currentMonth.Month, 1);
        var monthEnd = monthStart.AddMonths(1).AddDays(-1);

        var approvedThisMonth = await _dbContext.LeaveApplications
            .AsNoTracking()
            .Where(x =>
                x.UserId == balance.UserId
                && x.LeaveTypeId == balance.LeaveTypeId
                && x.StatusCode == 1
                && x.ApprovalStatus == "APPROVED"
                && x.FromDate >= monthStart
                && x.FromDate <= monthEnd)
            .SumAsync(x => x.TotalDays, cancellationToken);

        balance.MonthlyUsed = approvedThisMonth;
        balance.MonthlyPending = Math.Max(
            0m,
            balance.MonthlyAllocation + balance.MonthlyCarryForward - approvedThisMonth);
    }

    private static bool IsSameCalendarMonth(DateOnly left, DateOnly right) =>
        left.Year == right.Year && left.Month == right.Month;

    /// <summary>
    /// Warn only when the request clearly exceeds the monthly quota (e.g. 2 days when 1 remains).
    /// Suppresses fractional "0.3 day" noise caused by annual/12 accrual rounding on single-day requests.
    /// </summary>
    private static decimal CalculateMonthlyExcessForWarning(
        decimal totalDays,
        decimal monthlyRemaining)
    {
        if (monthlyRemaining >= totalDays)
        {
            return 0m;
        }

        var excessDays = totalDays - monthlyRemaining;

        if (totalDays <= Math.Ceiling(monthlyRemaining))
        {
            return 0m;
        }

        return excessDays;
    }

    private static string FormatLeaveDays(decimal days) =>
        days == 1m ? "1 day" :
        days == 0.5m ? "0.5 day" :
        $"{days:0.#} days";

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
            LeaveTypeId = leaveApplication.LeaveTypeId,
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

    private async Task<bool> HasPendingLeaveOverlapAsync(
        int userId,
        DateOnly fromDate,
        DateOnly toDate,
        int? excludeLeaveId,
        CancellationToken cancellationToken)
    {
        var query = _dbContext.LeaveApplications.AsNoTracking()
            .Where(x =>
                x.UserId == userId
                && x.StatusCode == 1
                && x.ApprovalStatus == "PENDING"
                && x.FromDate <= toDate
                && x.ToDate >= fromDate);

        if (excludeLeaveId.HasValue)
        {
            query = query.Where(x => x.Id != excludeLeaveId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    private async Task<LeaveApplication> LoadOwnedPendingLeaveForModifyAsync(
        int leaveId,
        int userId,
        CancellationToken cancellationToken)
    {
        var leave = await _dbContext.LeaveApplications
            .FirstOrDefaultAsync(
                x => x.Id == leaveId && x.StatusCode == 1,
                cancellationToken)
            ?? throw new KeyNotFoundException($"Leave application {leaveId} was not found.");

        if (leave.UserId != userId)
        {
            throw new UnauthorizedAccessException("You can only modify your own leave applications.");
        }

        if (leave.ApprovalStatus != "PENDING")
        {
            throw new InvalidOperationException(
                $"Only pending leave applications can be modified. Current status: {leave.ApprovalStatus}.");
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        if (leave.FromDate <= today)
        {
            throw new InvalidOperationException(
                "Leave cannot be modified once the leave date has arrived or passed.");
        }

        return leave;
    }

    private async Task<LeaveApplication> LoadPendingForManagerReviewAsync(
        int id,
        int approverId,
        int companyId,
        CancellationToken cancellationToken)
    {
        var entity = await _dbContext.LeaveApplications
            .FirstOrDefaultAsync(
                x => x.Id == id && x.StatusCode == 1,
                cancellationToken)
            ?? throw new KeyNotFoundException(
                $"Leave application {id} was not found.");

        if (entity.ApprovalStatus != "PENDING")
        {
            throw new InvalidOperationException(
                $"Only pending requests can be reviewed. Current status: {entity.ApprovalStatus}.");
        }

        var employee = await _dbContext.UserMasters
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == entity.UserId && x.StatusCode == 1,
                cancellationToken)
            ?? throw new InvalidOperationException("Employee not found.");

        if (employee.CompanyId != companyId)
        {
            throw new UnauthorizedAccessException(
                "You cannot review requests outside your company.");
        }

        if (employee.ManagerId != approverId)
        {
            throw new UnauthorizedAccessException(
                "You are not the reporting manager for this employee.");
        }

        return entity;
    }

    private async Task DeductLeaveBalanceOnApprovalAsync(
        int userId,
        int leaveTypeId,
        DateOnly leaveFromDate,
        decimal totalDays,
        int companyId,
        int updatedBy,
        CancellationToken cancellationToken)
    {
        var company = await _dbContext.CompanyMasters
            .AsNoTracking()
            .Where(x => x.Id == companyId && x.StatusCode == 1)
            .Select(x => new
            {
                x.Timezone,
                x.FiscalYearStartMonth,
                x.FiscalYearStartDay,
            })
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new InvalidOperationException("Company not found.");

        var companyToday = FiscalYearHelper.GetCompanyToday(company.Timezone);
        var fiscalCycleYear = FiscalYearHelper.GetFiscalCycleStartYear(
            companyToday,
            company.FiscalYearStartMonth,
            company.FiscalYearStartDay);

        var balance = await _dbContext.UserLeaveBalances
            .FirstOrDefaultAsync(
                x => x.UserId == userId
                    && x.LeaveTypeId == leaveTypeId
                    && x.CycleYear == fiscalCycleYear
                    && x.StatusCode == 1,
                cancellationToken)
            ?? throw new InvalidOperationException(
                "Leave balance record not found for this employee.");

        await EnsureMonthlyAllocationAsync(balance, cancellationToken);

        var approvedInLeaveMonth = await GetApprovedDaysInLeaveMonthAsync(
            userId,
            leaveTypeId,
            leaveFromDate,
            cancellationToken);

        var availableInLeaveMonth = balance.MonthlyAllocation
            + balance.MonthlyCarryForward
            - approvedInLeaveMonth;

        var borrowFromFuture = Math.Max(0m, totalDays - availableInLeaveMonth);

        if (borrowFromFuture > 0)
        {
            balance.MonthlyCarryForward -= borrowFromFuture;
        }

        if (IsSameCalendarMonth(leaveFromDate, companyToday))
        {
            balance.MonthlyUsed = approvedInLeaveMonth + totalDays;
            balance.MonthlyPending = Math.Max(
                0m,
                balance.MonthlyAllocation + balance.MonthlyCarryForward - balance.MonthlyUsed);
        }

        if (balance.AvailableBalance < totalDays)
        {
            throw new InvalidOperationException(
                "Insufficient leave balance to approve this application.");
        }

        var now = DateTimeOffset.UtcNow;

        balance.TakenDays += totalDays;
        balance.AvailableBalance -= totalDays;
        balance.UpdatedBy = updatedBy;
        balance.UpdatedOn = now;
    }

    private async Task<ManagerLeaveApplicationListItemDto> MapManagerLeaveApplicationAsync(
        int leaveApplicationId,
        CancellationToken cancellationToken)
    {
        return await (
            from leaveApplication in _dbContext.LeaveApplications.AsNoTracking()
            join employee in _dbContext.UserMasters.AsNoTracking()
                on leaveApplication.UserId equals employee.Id
            join leaveType in _dbContext.LeaveTypeMasters.AsNoTracking()
                on leaveApplication.LeaveTypeId equals leaveType.Id
            join approver in _dbContext.UserMasters.AsNoTracking()
                on leaveApplication.ApprovedBy equals approver.Id into approvers
            from approver in approvers.DefaultIfEmpty()
            where leaveApplication.Id == leaveApplicationId
            select new ManagerLeaveApplicationListItemDto
            {
                Id = leaveApplication.Id,
                UserId = leaveApplication.UserId,
                UserName = employee.FullName,
                LeaveTypeId = leaveApplication.LeaveTypeId,
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
            .FirstAsync(cancellationToken);
    }
}
