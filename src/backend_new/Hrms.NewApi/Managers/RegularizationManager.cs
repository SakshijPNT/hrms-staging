using Hrms.NewApi.Data;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Hrms.NewApi.Models;
using Microsoft.EntityFrameworkCore;
using TimeZoneConverter;

namespace Hrms.NewApi.Managers;

public class RegularizationManager : IRegularizationManager
{
    private readonly HrmsDbContext _dbContext;

    public RegularizationManager(HrmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<RegularizationPreviewDto> GetPreviewAsync(
        int userId,
        int companyId,
        DateOnly logDate,
        CancellationToken cancellationToken = default)
    {
        var context = await BuildValidationContextAsync(
            userId,
            companyId,
            logDate,
            cancellationToken);

        var attendance = await _dbContext.UserAttendanceLogs
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.UserId == userId
                    && x.LogDate == logDate
                    && x.StatusCode == 1,
                cancellationToken);

        return new RegularizationPreviewDto
        {
            LogDate = logDate,
            AttendanceLogId = attendance?.Id,
            OriginalCheckInTime = attendance?.CheckInTime,
            OriginalCheckOutTime = attendance?.CheckOutTime,
            CanSubmit = context.CanSubmit,
            BlockReason = context.BlockReason,
        };
    }

    public async Task<RegularizationListItemDto> CreateAsync(
        int userId,
        int companyId,
        CreateRegularizationDto request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new InvalidOperationException("Reason is required.");
        }

        if (request.RequestedCheckOutTime <= request.RequestedCheckInTime)
        {
            throw new InvalidOperationException(
                "Requested check-out time must be later than check-in time.");
        }

        var validation = await BuildValidationContextAsync(
            userId,
            companyId,
            request.LogDate,
            cancellationToken);

        if (!validation.CanSubmit)
        {
            throw new InvalidOperationException(
                validation.BlockReason ?? "Regularization is not allowed for this date.");
        }

        var attendance = await _dbContext.UserAttendanceLogs
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.UserId == userId
                    && x.LogDate == request.LogDate
                    && x.StatusCode == 1,
                cancellationToken);

        var requestedCheckInUtc = ToUtcOffset(
            request.LogDate,
            request.RequestedCheckInTime,
            validation.TimezoneInfo);

        var requestedCheckOutUtc = ToUtcOffset(
            request.LogDate,
            request.RequestedCheckOutTime,
            validation.TimezoneInfo);

        if (requestedCheckOutUtc <= requestedCheckInUtc)
        {
            throw new InvalidOperationException(
                "Requested check-out time must be later than check-in time.");
        }

        var now = DateTimeOffset.UtcNow;
        var entity = new AttendanceRegularization
        {
            UserId = userId,
            LogDate = request.LogDate,
            AttendanceLogId = attendance?.Id,
            OriginalCheckInTime = attendance?.CheckInTime,
            OriginalCheckOutTime = attendance?.CheckOutTime,
            RequestedCheckInTime = requestedCheckInUtc,
            RequestedCheckOutTime = requestedCheckOutUtc,
            Reason = request.Reason.Trim(),
            ApprovalStatus = "PENDING",
            StatusCode = 1,
            CreatedBy = userId,
            UpdatedBy = userId,
            CreatedOn = now,
            UpdatedOn = now,
        };

        _dbContext.AttendanceRegularizations.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await MapListItemAsync(entity.Id, cancellationToken);
    }

    public async Task<IReadOnlyList<RegularizationListItemDto>> GetMyRequestsAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        return await (
            from item in _dbContext.AttendanceRegularizations.AsNoTracking()
            where item.UserId == userId && item.StatusCode == 1
            join approver in _dbContext.UserMasters.AsNoTracking()
                on item.ApprovedBy equals approver.Id into approvers
            from approver in approvers.DefaultIfEmpty()
            orderby item.CreatedOn descending
            select new RegularizationListItemDto
            {
                Id = item.Id,
                LogDate = item.LogDate,
                OriginalCheckInTime = item.OriginalCheckInTime,
                OriginalCheckOutTime = item.OriginalCheckOutTime,
                RequestedCheckInTime = item.RequestedCheckInTime,
                RequestedCheckOutTime = item.RequestedCheckOutTime,
                Reason = item.Reason,
                ApprovalStatus = item.ApprovalStatus,
                ApprovedBy = item.ApprovedBy,
                ApproverEmailId = approver == null ? null : approver.EmailId,
                ApprovedOn = item.ApprovedOn,
                ApproverRemark = item.ApproverRemark,
                CreatedOn = item.CreatedOn,
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<RegularizationListItemDto> CancelAsync(
        int id,
        int userId,
        CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.AttendanceRegularizations
            .FirstOrDefaultAsync(
                x => x.Id == id && x.StatusCode == 1,
                cancellationToken)
            ?? throw new KeyNotFoundException(
                $"Regularization request {id} was not found.");

        if (entity.UserId != userId)
        {
            throw new UnauthorizedAccessException(
                "You can only cancel your own regularization requests.");
        }

        if (entity.ApprovalStatus != "PENDING")
        {
            throw new InvalidOperationException(
                $"Only pending requests can be cancelled. Current status: {entity.ApprovalStatus}.");
        }

        entity.ApprovalStatus = "CANCELLED";
        entity.UpdatedBy = userId;
        entity.UpdatedOn = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await MapListItemAsync(entity.Id, cancellationToken);
    }

    public async Task<IReadOnlyList<ManagerRegularizationListItemDto>> GetPendingForManagerAsync(
        int managerId,
        int companyId,
        CancellationToken cancellationToken = default)
    {
        return await (
            from item in _dbContext.AttendanceRegularizations.AsNoTracking()
            join employee in _dbContext.UserMasters.AsNoTracking()
                on item.UserId equals employee.Id
            where item.ApprovalStatus == "PENDING"
                && item.StatusCode == 1
                && employee.CompanyId == companyId
                && employee.ManagerId == managerId
                && employee.StatusCode == 1
            orderby item.CreatedOn ascending
            select new ManagerRegularizationListItemDto
            {
                Id = item.Id,
                UserId = item.UserId,
                EmployeeName = employee.FullName,
                EmployeeEmail = employee.EmailId,
                LogDate = item.LogDate,
                OriginalCheckInTime = item.OriginalCheckInTime,
                OriginalCheckOutTime = item.OriginalCheckOutTime,
                RequestedCheckInTime = item.RequestedCheckInTime,
                RequestedCheckOutTime = item.RequestedCheckOutTime,
                Reason = item.Reason,
                ApprovalStatus = item.ApprovalStatus,
                ApprovedBy = item.ApprovedBy,
                ApproverEmailId = null,
                ApprovedOn = item.ApprovedOn,
                ApproverRemark = item.ApproverRemark,
                CreatedOn = item.CreatedOn,
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<RegularizationListItemDto> ApproveAsync(
        int id,
        int approverId,
        int companyId,
        ReviewRegularizationDto request,
        CancellationToken cancellationToken = default)
    {
        var entity = await LoadPendingForManagerReviewAsync(
            id,
            approverId,
            companyId,
            cancellationToken);

        var employee = await _dbContext.UserMasters
            .AsNoTracking()
            .FirstAsync(x => x.Id == entity.UserId, cancellationToken);

        var policy = await GetCompanyPolicyAsync(employee.CompanyId, cancellationToken);
        var company = await _dbContext.CompanyMasters
            .AsNoTracking()
            .FirstAsync(x => x.Id == employee.CompanyId, cancellationToken);

        var timezoneInfo = GetTimezoneInfo(company.Timezone);
        var now = DateTimeOffset.UtcNow;

        await ApplyApprovedTimesToAttendanceLogAsync(
            entity,
            employee.Id,
            approverId,
            policy,
            timezoneInfo,
            now,
            cancellationToken);

        entity.ApprovalStatus = "APPROVED";
        entity.ApprovedBy = approverId;
        entity.ApprovedOn = now;
        entity.ApproverRemark = request.ApproverRemark?.Trim();
        entity.UpdatedBy = approverId;
        entity.UpdatedOn = now;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await MapListItemAsync(entity.Id, cancellationToken);
    }

    public async Task<RegularizationListItemDto> RejectAsync(
        int id,
        int approverId,
        int companyId,
        ReviewRegularizationDto request,
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

        return await MapListItemAsync(entity.Id, cancellationToken);
    }

    private async Task ApplyApprovedTimesToAttendanceLogAsync(
        AttendanceRegularization entity,
        int employeeId,
        int approverId,
        CompanyPolicies policy,
        TimeZoneInfo timezoneInfo,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        UserAttendanceLog attendance;
        if (entity.AttendanceLogId.HasValue)
        {
            attendance = await _dbContext.UserAttendanceLogs
                .FirstOrDefaultAsync(
                    x => x.Id == entity.AttendanceLogId.Value
                        && x.StatusCode == 1,
                    cancellationToken)
                ?? throw new InvalidOperationException(
                    "Linked attendance log was not found.");
        }
        else
        {
            var existing = await _dbContext.UserAttendanceLogs
                .FirstOrDefaultAsync(
                    x => x.UserId == employeeId
                        && x.LogDate == entity.LogDate
                        && x.StatusCode == 1,
                    cancellationToken);

            if (existing == null)
            {
                attendance = new UserAttendanceLog
                {
                    UserId = employeeId,
                    LogDate = entity.LogDate,
                    StatusCode = 1,
                    CreatedBy = approverId,
                    CreatedOn = now,
                };
                _dbContext.UserAttendanceLogs.Add(attendance);
            }
            else
            {
                attendance = existing;
            }
        }

        attendance.CheckInTime = entity.RequestedCheckInTime;
        attendance.CheckOutTime = entity.RequestedCheckOutTime;
        attendance.WorkedMinutes = (int)(
            entity.RequestedCheckOutTime - entity.RequestedCheckInTime).TotalMinutes;

        attendance.IsLate = IsCheckInLate(
            entity.RequestedCheckInTime,
            policy,
            timezoneInfo);

        var checkOutLocalTime = ToCompanyLocalTime(
            entity.RequestedCheckOutTime,
            timezoneInfo);

        attendance.IsEarlyLeave = IsCheckOutEarly(checkOutLocalTime, policy);
        attendance.AttendanceStatus = ResolveAttendanceStatus(
            attendance.WorkedMinutes,
            attendance.IsEarlyLeave,
            policy);

        attendance.Remarks = "Regularized";
        attendance.UpdatedBy = approverId;
        attendance.UpdatedOn = now;

        if (attendance.Id == 0)
        {
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        entity.AttendanceLogId = attendance.Id;
    }

    private async Task<AttendanceRegularization> LoadPendingForManagerReviewAsync(
        int id,
        int approverId,
        int companyId,
        CancellationToken cancellationToken)
    {
        var entity = await _dbContext.AttendanceRegularizations
            .FirstOrDefaultAsync(
                x => x.Id == id && x.StatusCode == 1,
                cancellationToken)
            ?? throw new KeyNotFoundException(
                $"Regularization request {id} was not found.");

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

    private async Task<ValidationContext> BuildValidationContextAsync(
        int userId,
        int companyId,
        DateOnly logDate,
        CancellationToken cancellationToken)
    {
        var company = await _dbContext.CompanyMasters
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == companyId,
                cancellationToken)
            ?? throw new InvalidOperationException("Company not found.");

        var policy = await GetCompanyPolicyAsync(companyId, cancellationToken);
        var timezoneInfo = GetTimezoneInfo(company.Timezone);
        var today = DateOnly.FromDateTime(
            ToCompanyLocal(DateTimeOffset.UtcNow, timezoneInfo).DateTime);

        if (logDate >= today)
        {
            return ValidationContext.Blocked(
                timezoneInfo,
                "Regularization is allowed only for past dates.");
        }

        var workDays = ParseWorkDays(policy.WorkDays);
        if (!workDays.Contains(logDate.DayOfWeek))
        {
            return ValidationContext.Blocked(
                timezoneInfo,
                "Regularization cannot be requested for a week-off.");
        }

        var isHoliday = await _dbContext.HolidayLists.AnyAsync(
            x => x.CompanyId == companyId
                && x.HolidayDate == logDate
                && x.StatusCode == 1,
            cancellationToken);

        if (isHoliday)
        {
            return ValidationContext.Blocked(
                timezoneInfo,
                "Regularization cannot be requested for a company holiday.");
        }

        var hasPending = await _dbContext.AttendanceRegularizations.AnyAsync(
            x => x.UserId == userId
                && x.LogDate == logDate
                && x.ApprovalStatus == "PENDING"
                && x.StatusCode == 1,
            cancellationToken);

        if (hasPending)
        {
            return ValidationContext.Blocked(
                timezoneInfo,
                "A regularization request is already pending for this date.");
        }

        var hasApproved = await _dbContext.AttendanceRegularizations.AnyAsync(
            x => x.UserId == userId
                && x.LogDate == logDate
                && x.ApprovalStatus == "APPROVED"
                && x.StatusCode == 1,
            cancellationToken);

        if (hasApproved)
        {
            return ValidationContext.Blocked(
                timezoneInfo,
                "This date already has an approved regularization.");
        }

        return ValidationContext.Allowed(timezoneInfo);
    }

    private async Task<CompanyPolicies> GetCompanyPolicyAsync(
        int companyId,
        CancellationToken cancellationToken)
    {
        return await _dbContext.CompanyPolicies
            .AsNoTracking()
            .Where(x => x.CompanyId == companyId && x.StatusCode == 1)
            .OrderByDescending(x => x.UpdatedOn)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new InvalidOperationException("Company policy not found.");
    }

    private async Task<RegularizationListItemDto> MapListItemAsync(
        int id,
        CancellationToken cancellationToken)
    {
        return await (
            from item in _dbContext.AttendanceRegularizations.AsNoTracking()
            where item.Id == id
            join approver in _dbContext.UserMasters.AsNoTracking()
                on item.ApprovedBy equals approver.Id into approvers
            from approver in approvers.DefaultIfEmpty()
            select new RegularizationListItemDto
            {
                Id = item.Id,
                LogDate = item.LogDate,
                OriginalCheckInTime = item.OriginalCheckInTime,
                OriginalCheckOutTime = item.OriginalCheckOutTime,
                RequestedCheckInTime = item.RequestedCheckInTime,
                RequestedCheckOutTime = item.RequestedCheckOutTime,
                Reason = item.Reason,
                ApprovalStatus = item.ApprovalStatus,
                ApprovedBy = item.ApprovedBy,
                ApproverEmailId = approver == null ? null : approver.EmailId,
                ApprovedOn = item.ApprovedOn,
                ApproverRemark = item.ApproverRemark,
                CreatedOn = item.CreatedOn,
            })
            .FirstAsync(cancellationToken);
    }

    private static DateTimeOffset ToUtcOffset(
        DateOnly date,
        TimeOnly time,
        TimeZoneInfo timezoneInfo)
    {
        var localDateTime = date.ToDateTime(time);
        var unspecified = DateTime.SpecifyKind(localDateTime, DateTimeKind.Unspecified);
        var utc = TimeZoneInfo.ConvertTimeToUtc(unspecified, timezoneInfo);
        return new DateTimeOffset(utc, TimeSpan.Zero);
    }

    private static TimeZoneInfo GetTimezoneInfo(string? timezone)
    {
        return TZConvert.GetTimeZoneInfo(
            string.IsNullOrWhiteSpace(timezone)
                ? "Asia/Kolkata"
                : timezone);
    }

    private static DateTimeOffset ToCompanyLocal(
        DateTimeOffset utcTime,
        TimeZoneInfo timezoneInfo)
    {
        return TimeZoneInfo.ConvertTime(utcTime, timezoneInfo);
    }

    private static TimeOnly ToCompanyLocalTime(
        DateTimeOffset utcTime,
        TimeZoneInfo timezoneInfo)
    {
        return TimeOnly.FromDateTime(ToCompanyLocal(utcTime, timezoneInfo).DateTime);
    }

    private static bool IsCheckInLate(
        DateTimeOffset checkInUtc,
        CompanyPolicies policy,
        TimeZoneInfo timezoneInfo)
    {
        var actualCheckInTime = ToCompanyLocalTime(checkInUtc, timezoneInfo);
        var allowedCheckIn = policy.ShiftStart.AddMinutes(policy.CheckInGracePeriod);
        return actualCheckInTime > allowedCheckIn;
    }

    private static bool IsCheckOutEarly(
        TimeOnly actualCheckOutTime,
        CompanyPolicies policy)
    {
        var allowedCheckOut = policy.ShiftEnd.AddMinutes(-policy.CheckOutGracePeriod);
        return actualCheckOutTime < allowedCheckOut;
    }

    private static string ResolveAttendanceStatus(
        int workedMinutes,
        bool isEarlyLeave,
        CompanyPolicies policy)
    {
        var fullDayMinutes = (int)(policy.WorkHours * 60);
        var halfDayMinutes = (int)(policy.HalfDayThreshold * 60);

        if (!isEarlyLeave && workedMinutes >= fullDayMinutes)
        {
            return "PRESENT";
        }

        if (workedMinutes >= halfDayMinutes)
        {
            return "HALF_DAY";
        }

        return "ABSENT";
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

    private sealed class ValidationContext
    {
        public TimeZoneInfo TimezoneInfo { get; init; } = null!;
        public bool CanSubmit { get; init; }
        public string? BlockReason { get; init; }

        public static ValidationContext Allowed(TimeZoneInfo timezoneInfo) =>
            new() { TimezoneInfo = timezoneInfo, CanSubmit = true };

        public static ValidationContext Blocked(TimeZoneInfo timezoneInfo, string reason) =>
            new() { TimezoneInfo = timezoneInfo, CanSubmit = false, BlockReason = reason };
    }
}
