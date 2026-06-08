using Hrms.NewApi.Data;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Hrms.NewApi.Models;
using Hrms.NewApi.Support;
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

        var attendance = await GetAttendanceLogAsync(userId, logDate, cancellationToken);

        return new RegularizationPreviewDto
        {
            LogDate = logDate,
            AttendanceLogId = attendance?.Id,
            OriginalAttendanceStatus = context.OriginalStatus,
            OriginalCheckInTime = attendance?.CheckInTime,
            OriginalCheckOutTime = attendance?.CheckOutTime,
            WorkedMinutes = attendance?.WorkedMinutes,
            CanSubmit = context.CanSubmit,
            BlockReason = context.BlockReason,
            AllowedCorrectionTypes = context.AllowedCorrectionTypes,
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

        var company = await _dbContext.CompanyMasters
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == companyId,
                cancellationToken)
            ?? throw new InvalidOperationException("Company not found.");

        var correctionType = NormalizeCorrectionType(request.RequestedCorrectionType);

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

        if (!validation.AllowedCorrectionTypes.Contains(correctionType))
        {
            throw new InvalidOperationException(
                $"Correction type {correctionType} is not allowed for this attendance status.");
        }

        var attendance = await GetAttendanceLogAsync(
            userId,
            request.LogDate,
            cancellationToken);

        var timezoneInfo = GetTimezoneInfo(company.Timezone);
        DateTimeOffset? requestedCheckIn = null;
        DateTimeOffset? requestedCheckOut = null;

        if (AttendanceStatusHelper.IsTimeBasedCorrection(correctionType))
        {
            requestedCheckIn = ParseRequestedLogTime(
                request.LogDate,
                request.RequestedCheckInTime,
                timezoneInfo,
                "Regularized check-in time");
            requestedCheckOut = ParseRequestedLogTime(
                request.LogDate,
                request.RequestedCheckOutTime,
                timezoneInfo,
                "Regularized check-out time");

            if (requestedCheckOut <= requestedCheckIn)
            {
                throw new InvalidOperationException(
                    "Regularized check-out must be later than check-in.");
            }
        }

        var now = DateTimeOffset.UtcNow;
        var entity = new AttendanceRegularization
        {
            UserId = userId,
            LogDate = request.LogDate,
            AttendanceLogId = attendance?.Id,
            OriginalCheckInTime = attendance?.CheckInTime,
            OriginalCheckOutTime = attendance?.CheckOutTime,
            OriginalAttendanceStatus = validation.OriginalStatus!,
            RequestedCorrectionType = correctionType,
            RequestedCheckInTime = requestedCheckIn,
            RequestedCheckOutTime = requestedCheckOut,
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
                OriginalAttendanceStatus = item.OriginalAttendanceStatus,
                RequestedCorrectionType = item.RequestedCorrectionType,
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
                OriginalAttendanceStatus = item.OriginalAttendanceStatus,
                RequestedCorrectionType = item.RequestedCorrectionType,
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

        var company = await _dbContext.CompanyMasters
            .AsNoTracking()
            .FirstAsync(x => x.Id == employee.CompanyId, cancellationToken);

        var policy = await GetCompanyPolicyAsync(employee.CompanyId, cancellationToken);
        var now = DateTimeOffset.UtcNow;

        await ApplyRegularizationApprovalAsync(
            entity,
            employee.Id,
            approverId,
            policy,
            GetTimezoneInfo(company.Timezone),
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

        if (string.IsNullOrWhiteSpace(request.ApproverRemark))
        {
            throw new InvalidOperationException(
                "Rejection reason is required.");
        }

        var now = DateTimeOffset.UtcNow;

        entity.ApprovalStatus = "REJECTED";
        entity.ApprovedBy = approverId;
        entity.ApprovedOn = now;
        entity.ApproverRemark = request.ApproverRemark.Trim();
        entity.UpdatedBy = approverId;
        entity.UpdatedOn = now;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await MapListItemAsync(entity.Id, cancellationToken);
    }

    private async Task ApplyRegularizationApprovalAsync(
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
                    x => x.Id == entity.AttendanceLogId.Value && x.StatusCode == 1,
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

        if (AttendanceStatusHelper.IsTimeBasedCorrection(entity.RequestedCorrectionType))
        {
            if (!entity.RequestedCheckInTime.HasValue
                || !entity.RequestedCheckOutTime.HasValue)
            {
                throw new InvalidOperationException(
                    "Requested check-in and check-out times are required.");
            }

            var workedMinutes = (int)Math.Max(
                0,
                (entity.RequestedCheckOutTime.Value - entity.RequestedCheckInTime.Value).TotalMinutes);

            attendance.CheckInTime = entity.RequestedCheckInTime;
            attendance.CheckOutTime = entity.RequestedCheckOutTime;
            attendance.WorkedMinutes = workedMinutes;
            attendance.AttendanceStatus = AttendanceStatusHelper.ResolveFromWorkedMinutes(
                workedMinutes,
                true,
                false,
                policy);
            attendance.IsEarlyLeave =
                attendance.AttendanceStatus != AttendanceStatusHelper.Present;
        }
        else
        {
            var newStatus = AttendanceStatusHelper.ResolveStatusAfterRegularization(
                entity.OriginalAttendanceStatus,
                entity.RequestedCorrectionType);

            var workedMinutes = AttendanceStatusHelper.ResolveWorkedMinutesForCorrection(
                entity.RequestedCorrectionType,
                policy);

            attendance.AttendanceStatus = newStatus;
            attendance.WorkedMinutes = workedMinutes;
            attendance.IsEarlyLeave = newStatus != AttendanceStatusHelper.Present;
        }

        attendance.IsRegularized = true;
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
                "Regularization is allowed only after the day's attendance status is finalised.");
        }

        var windowDays = policy.RegularizationWindowDays > 0
            ? policy.RegularizationWindowDays
            : 30;

        var earliestEligibleDate = today.AddDays(-windowDays);
        if (logDate < earliestEligibleDate)
        {
            return ValidationContext.Blocked(
                $"Regularization is allowed only within the last {windowDays} days.");
        }

        var workDays = ParseWorkDays(policy.WorkDays);
        if (!workDays.Contains(logDate.DayOfWeek))
        {
            return ValidationContext.Blocked(
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
                "Regularization cannot be requested for a company holiday.");
        }

        if (await HasApprovedLeaveOnDateAsync(userId, logDate, cancellationToken))
        {
            return ValidationContext.Blocked(
                "Regularization cannot be requested when approved leave exists for this day.");
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
                "This date already has an approved regularization.");
        }

        var attendance = await GetAttendanceLogAsync(userId, logDate, cancellationToken);
        var originalStatus = AttendanceStatusHelper.ResolveEffectiveStatus(
            attendance,
            policy);

        if (originalStatus == AttendanceStatusHelper.CheckedIn)
        {
            return ValidationContext.Allowed(
                originalStatus,
                GetAllowedCorrectionTypes(originalStatus));
        }

        if (!AttendanceStatusHelper.IsRegularizationEligible(originalStatus))
        {
            return ValidationContext.Blocked(
                "Regularization is available only for Absent, Half Day, Short Day, or missing checkout.");
        }

        return ValidationContext.Allowed(
            originalStatus,
            GetAllowedCorrectionTypes(originalStatus));
    }

    private static IReadOnlyList<string> GetAllowedCorrectionTypes(string originalStatus)
    {
        return originalStatus switch
        {
            AttendanceStatusHelper.Absent =>
            [
                AttendanceStatusHelper.CorrectionFullDay,
                AttendanceStatusHelper.CorrectionHalfDay,
                AttendanceStatusHelper.CorrectionShortDay,
                AttendanceStatusHelper.CorrectionForgotCheckIn,
                AttendanceStatusHelper.CorrectionForgotCheckOut,
            ],
            AttendanceStatusHelper.HalfDay =>
            [
                AttendanceStatusHelper.CorrectionFullDay,
                AttendanceStatusHelper.CorrectionShortDay,
                AttendanceStatusHelper.CorrectionForgotCheckIn,
                AttendanceStatusHelper.CorrectionForgotCheckOut,
            ],
            AttendanceStatusHelper.ShortDay =>
            [
                AttendanceStatusHelper.CorrectionFullDay,
                AttendanceStatusHelper.CorrectionHalfDay,
                AttendanceStatusHelper.CorrectionShortDay,
                AttendanceStatusHelper.CorrectionForgotCheckIn,
                AttendanceStatusHelper.CorrectionForgotCheckOut,
            ],
            AttendanceStatusHelper.CheckedIn =>
            [
                AttendanceStatusHelper.CorrectionFullDay,
                AttendanceStatusHelper.CorrectionHalfDay,
                AttendanceStatusHelper.CorrectionShortDay,
                AttendanceStatusHelper.CorrectionForgotCheckIn,
                AttendanceStatusHelper.CorrectionForgotCheckOut,
            ],
            _ => Array.Empty<string>(),
        };
    }

    private static string NormalizeCorrectionType(string value)
    {
        var normalized = value.Trim().ToUpperInvariant();
        if (normalized is AttendanceStatusHelper.CorrectionFullDay
            or AttendanceStatusHelper.CorrectionHalfDay
            or AttendanceStatusHelper.CorrectionShortDay
            or AttendanceStatusHelper.CorrectionForgotCheckIn
            or AttendanceStatusHelper.CorrectionForgotCheckOut)
        {
            return normalized;
        }

        throw new InvalidOperationException(
            "Requested correction type is not supported.");
    }

    private static DateTimeOffset ParseRequestedLogTime(
        DateOnly logDate,
        string? timeValue,
        TimeZoneInfo timezoneInfo,
        string fieldLabel)
    {
        if (string.IsNullOrWhiteSpace(timeValue))
        {
            throw new InvalidOperationException($"{fieldLabel} is required.");
        }

        if (!TimeSpan.TryParse(timeValue.Trim(), out var time))
        {
            throw new InvalidOperationException($"{fieldLabel} is invalid.");
        }

        var local = new DateTime(
            logDate.Year,
            logDate.Month,
            logDate.Day,
            0,
            0,
            0,
            DateTimeKind.Unspecified).Add(time);

        var companyOffset = timezoneInfo.GetUtcOffset(local);
        return new DateTimeOffset(local, companyOffset).ToUniversalTime();
    }

    private async Task<bool> HasApprovedLeaveOnDateAsync(
        int userId,
        DateOnly logDate,
        CancellationToken cancellationToken)
    {
        return await _dbContext.LeaveApplications
            .AsNoTracking()
            .AnyAsync(
                x => x.UserId == userId
                    && x.StatusCode == 1
                    && x.ApprovalStatus == "APPROVED"
                    && x.FromDate <= logDate
                    && x.ToDate >= logDate,
                cancellationToken);
    }

    private async Task<UserAttendanceLog?> GetAttendanceLogAsync(
        int userId,
        DateOnly logDate,
        CancellationToken cancellationToken)
    {
        return await _dbContext.UserAttendanceLogs
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.UserId == userId
                    && x.LogDate == logDate
                    && x.StatusCode == 1,
                cancellationToken);
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
                OriginalAttendanceStatus = item.OriginalAttendanceStatus,
                RequestedCorrectionType = item.RequestedCorrectionType,
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
        public bool CanSubmit { get; init; }
        public string? BlockReason { get; init; }
        public string? OriginalStatus { get; init; }
        public IReadOnlyList<string> AllowedCorrectionTypes { get; init; } =
            Array.Empty<string>();

        public static ValidationContext Allowed(
            string originalStatus,
            IReadOnlyList<string> allowedCorrectionTypes) =>
            new()
            {
                CanSubmit = true,
                OriginalStatus = originalStatus,
                AllowedCorrectionTypes = allowedCorrectionTypes,
            };

        public static ValidationContext Blocked(string reason) =>
            new() { CanSubmit = false, BlockReason = reason };
    }
}
