using Hrms.NewApi.Data;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Hrms.NewApi.Models;
using Microsoft.EntityFrameworkCore;
using TimeZoneConverter;

namespace Hrms.NewApi.Managers;

public class CalendarManager : ICalendarManager
{
    private readonly HrmsDbContext _dbContext;
    private readonly IAttendanceManager _attendanceManager;

    public CalendarManager(
        HrmsDbContext dbContext,
        IAttendanceManager attendanceManager)
    {
        _dbContext = dbContext;
        _attendanceManager = attendanceManager;
    }

    public async Task<MonthlyCalendarResponseDto> GetMonthlyCalendarAsync(
        int userId,
        int year,
        int month,
        CancellationToken cancellationToken = default)
    {
        var context = await LoadUserContextAsync(userId, cancellationToken);
        var startDate = new DateOnly(year, month, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);

        var attendanceLogs = await _dbContext.UserAttendanceLogs
            .AsNoTracking()
            .Where(x => x.UserId == userId
                && x.LogDate >= startDate
                && x.LogDate <= endDate
                && x.StatusCode == 1)
            .ToListAsync(cancellationToken);

        var attendanceByDate = attendanceLogs.ToDictionary(x => x.LogDate);

        var holidays = await _dbContext.HolidayLists
            .AsNoTracking()
            .Where(x => x.CompanyId == context.CompanyId
                && x.StatusCode == 1
                && x.HolidayDate >= startDate
                && x.HolidayDate <= endDate)
            .ToDictionaryAsync(x => x.HolidayDate, cancellationToken);

        var leaveApplications = await LoadLeaveApplicationsAsync(
            userId,
            startDate,
            endDate,
            cancellationToken);

        var regularizations = await LoadRegularizationsAsync(
            userId,
            startDate,
            endDate,
            cancellationToken);

        var days = new List<CalendarDayDto>();
        for (var date = startDate; date <= endDate; date = date.AddDays(1))
        {
            days.Add(BuildCalendarDay(
                date,
                context,
                attendanceByDate,
                holidays,
                leaveApplications,
                regularizations));
        }

        return new MonthlyCalendarResponseDto
        {
            Year = year,
            Month = month,
            Timezone = context.Timezone,
            Days = days,
        };
    }

    public async Task<MonthlyAttendanceLogResponseDto> GetMonthlyAttendanceLogAsync(
        int userId,
        int year,
        int month,
        CancellationToken cancellationToken = default)
    {
        if (month is < 1 or > 12)
        {
            throw new InvalidOperationException("Month must be between 1 and 12.");
        }

        var context = await LoadUserContextAsync(userId, cancellationToken);
        var startDate = new DateOnly(year, month, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);

        var attendanceLogs = await _dbContext.UserAttendanceLogs
            .AsNoTracking()
            .Where(x => x.UserId == userId
                && x.LogDate >= startDate
                && x.LogDate <= endDate
                && x.StatusCode == 1)
            .ToListAsync(cancellationToken);

        var attendanceByDate = attendanceLogs.ToDictionary(x => x.LogDate);

        var holidays = await _dbContext.HolidayLists
            .AsNoTracking()
            .Where(x => x.CompanyId == context.CompanyId
                && x.StatusCode == 1
                && x.HolidayDate >= startDate
                && x.HolidayDate <= endDate)
            .ToDictionaryAsync(x => x.HolidayDate, cancellationToken);

        var leaveApplications = await LoadLeaveApplicationsAsync(
            userId,
            startDate,
            endDate,
            cancellationToken);

        var regularizations = await LoadRegularizationsAsync(
            userId,
            startDate,
            endDate,
            cancellationToken);

        var days = new List<AttendanceLogDayDto>();
        for (var date = startDate; date <= endDate; date = date.AddDays(1))
        {
            days.Add(BuildAttendanceLogDay(
                date,
                context,
                attendanceByDate,
                holidays,
                leaveApplications,
                regularizations));
        }

        return new MonthlyAttendanceLogResponseDto
        {
            Year = year,
            Month = month,
            Timezone = context.Timezone,
            Today = context.Today,
            Days = days,
        };
    }

    public async Task<DayDetailResponseDto> GetDayDetailAsync(
        int userId,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        var context = await LoadUserContextAsync(userId, cancellationToken);

        var holiday = await _dbContext.HolidayLists
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.CompanyId == context.CompanyId
                    && x.HolidayDate == date
                    && x.StatusCode == 1,
                cancellationToken);

        var dayType = ResolveDayType(date, context.WorkDays, holiday != null);

        var attendanceDto = await _attendanceManager.GetAttendanceByDateAsync(
            userId,
            date,
            cancellationToken);

        var leaveApplications = await LoadLeaveApplicationsAsync(
            userId,
            date,
            date,
            cancellationToken);

        var leaveBadges = GetLeaveBadgesForDate(date, leaveApplications);
        var workedMinutes = attendanceDto?.WorkedMinutes ?? 0;
        var workedHours = attendanceDto?.WorkedHours
            ?? Math.Round(workedMinutes / 60m, 1, MidpointRounding.AwayFromZero);

        return new DayDetailResponseDto
        {
            Date = date,
            DayType = dayType,
            HolidayName = holiday?.HolidayName,
            Attendance = attendanceDto,
            CheckInTime = attendanceDto?.CheckInTime,
            CheckOutTime = attendanceDto?.CheckOutTime,
            WorkedMinutes = workedMinutes,
            WorkedHours = workedHours,
            AttendanceStatus = ResolveDisplayStatus(
                date,
                dayType,
                attendanceDto,
                context.Today),
            IsLate = attendanceDto?.IsLate ?? false,
            IsEarlyLeave = attendanceDto?.IsEarlyLeave ?? false,
            LeaveInfo = leaveBadges,
        };
    }

    private static string? ResolveDisplayStatus(
        DateOnly date,
        string dayType,
        AttendanceResponseDto? attendance,
        DateOnly today)
    {
        if (attendance != null)
        {
            if (!string.IsNullOrWhiteSpace(attendance.AttendanceStatus))
            {
                return attendance.AttendanceStatus;
            }

            if (attendance.CheckInTime.HasValue)
            {
                return "CHECKED_IN";
            }
        }

        if (dayType == "HOLIDAY")
        {
            return "HOLIDAY";
        }

        if (dayType == "WEEK_OFF")
        {
            return "WEEK_OFF";
        }

        if (date > today)
        {
            return null;
        }

        return date < today ? "ABSENT" : null;
    }

    private async Task<UserCalendarContext> LoadUserContextAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        var user = await _dbContext.UserMasters
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == userId && x.StatusCode == 1,
                cancellationToken)
            ?? throw new InvalidOperationException(
                $"User with id {userId} does not exist.");

        var company = await _dbContext.CompanyMasters
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == user.CompanyId,
                cancellationToken);

        var policy = await _dbContext.CompanyPolicies
            .AsNoTracking()
            .Where(x => x.CompanyId == user.CompanyId && x.StatusCode == 1)
            .OrderByDescending(x => x.UpdatedOn)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new InvalidOperationException("Company policy not found.");

        var timezone = string.IsNullOrWhiteSpace(company?.Timezone)
            ? "Asia/Kolkata"
            : company!.Timezone;

        var timezoneInfo = TZConvert.GetTimeZoneInfo(timezone);
        var today = DateOnly.FromDateTime(
            TimeZoneInfo.ConvertTime(DateTimeOffset.UtcNow, timezoneInfo).DateTime);

        return new UserCalendarContext
        {
            CompanyId = user.CompanyId,
            Timezone = timezone,
            WorkDays = policy.WorkDays,
            Today = today,
        };
    }

    private static AttendanceLogDayDto BuildAttendanceLogDay(
        DateOnly date,
        UserCalendarContext context,
        IReadOnlyDictionary<DateOnly, UserAttendanceLog> attendanceByDate,
        IReadOnlyDictionary<DateOnly, HolidayList> holidays,
        IReadOnlyList<LeaveApplicationRow> leaveApplications,
        IReadOnlyDictionary<DateOnly, RegularizationRow> regularizationsByDate)
    {
        var isFuture = date > context.Today;
        var isToday = date == context.Today;
        holidays.TryGetValue(date, out var holiday);
        var dayType = ResolveDayType(date, context.WorkDays, holiday != null);
        attendanceByDate.TryGetValue(date, out var attendance);
        var leaveBadges = GetLeaveBadgesForDate(date, leaveApplications);
        var displayStatus = ResolveTableDisplayStatus(
            date,
            dayType,
            attendance,
            leaveBadges,
            context.Today);

        regularizationsByDate.TryGetValue(date, out var regularization);

        return new AttendanceLogDayDto
        {
            Date = date,
            DayType = dayType,
            DisplayStatus = displayStatus,
            HolidayName = holiday?.HolidayName,
            CheckInTime = attendance?.CheckInTime,
            CheckOutTime = attendance?.CheckOutTime,
            WorkedMinutes = attendance?.WorkedMinutes ?? 0,
            IsFuture = isFuture,
            IsToday = isToday,
            LeaveBadges = leaveBadges,
            HasRegularizationPending = regularization?.ApprovalStatus == "PENDING",
            IsRegularized = attendance?.IsRegularized ?? false,
            RegularizationStatus = BuildRegularizationStatusLabel(regularization),
        };
    }

    private static string? BuildRegularizationStatusLabel(RegularizationRow? regularization)
    {
        if (regularization == null)
        {
            return null;
        }

        var prefix = regularization.ApprovalStatus switch
        {
            "PENDING" => "Reg. Pending",
            "APPROVED" => "Reg. Approved",
            "REJECTED" => "Reg. Rejected",
            _ => null,
        };

        if (prefix == null)
        {
            return null;
        }

        if (regularization.RequestedCorrectionType == "HALF_DAY"
            && !string.IsNullOrWhiteSpace(regularization.Session))
        {
            var halfLabel = regularization.Session switch
            {
                "FIRST_HALF" => "1H",
                "SECOND_HALF" => "2H",
                _ => null,
            };

            if (halfLabel != null)
            {
                return $"{prefix} · {halfLabel} Regularize";
            }
        }

        return prefix;
    }

    private static string? ResolveTableDisplayStatus(
        DateOnly date,
        string dayType,
        UserAttendanceLog? attendance,
        IReadOnlyList<LeaveBadgeDto> leaveBadges,
        DateOnly today)
    {
        if (attendance != null)
        {
            if (!string.IsNullOrWhiteSpace(attendance.AttendanceStatus)
                && attendance.AttendanceStatus != "CHECKED_IN")
            {
                return attendance.AttendanceStatus;
            }

            if (attendance.CheckInTime.HasValue)
            {
                return string.IsNullOrWhiteSpace(attendance.AttendanceStatus)
                    ? "CHECKED_IN"
                    : attendance.AttendanceStatus;
            }
        }

        if (leaveBadges.Any(x => !x.IsPending))
        {
            return "LEAVE";
        }

        if (dayType == "HOLIDAY")
        {
            return "HOLIDAY";
        }

        if (dayType == "WEEK_OFF")
        {
            return "WEEK_OFF";
        }

        if (date > today)
        {
            return null;
        }

        if (leaveBadges.Any(x => x.IsPending))
        {
            return "LEAVE_PENDING";
        }

        return date < today ? "ABSENT" : null;
    }

    private static CalendarDayDto BuildCalendarDay(
        DateOnly date,
        UserCalendarContext context,
        IReadOnlyDictionary<DateOnly, UserAttendanceLog> attendanceByDate,
        IReadOnlyDictionary<DateOnly, HolidayList> holidays,
        IReadOnlyList<LeaveApplicationRow> leaveApplications,
        IReadOnlyDictionary<DateOnly, RegularizationRow> regularizationsByDate)
    {
        var isFuture = date > context.Today;
        holidays.TryGetValue(date, out var holiday);
        var dayType = ResolveDayType(date, context.WorkDays, holiday != null);
        attendanceByDate.TryGetValue(date, out var attendance);

        var leaveBadges = GetLeaveBadgesForDate(date, leaveApplications);
        var attendanceStatus = ResolveDisplayStatus(
            date,
            dayType,
            attendance,
            context.Today);

        regularizationsByDate.TryGetValue(date, out var regularization);

        return new CalendarDayDto
        {
            Date = date,
            AttendanceStatus = attendanceStatus,
            StatusColor = MapStatusColor(dayType, attendanceStatus, isFuture),
            HolidayName = holiday?.HolidayName,
            LeaveBadges = leaveBadges,
            IsFuture = isFuture,
            IsRegularized = attendance?.IsRegularized ?? false,
            HasRegularizationPending = regularization?.ApprovalStatus == "PENDING",
        };
    }

    private static string ResolveDayType(
        DateOnly date,
        string workDays,
        bool isHoliday)
    {
        if (isHoliday)
        {
            return "HOLIDAY";
        }

        var allowedDays = ParseWorkDays(workDays);
        return allowedDays.Contains(date.DayOfWeek)
            ? "WORKING"
            : "WEEK_OFF";
    }

    private static string? ResolveDisplayStatus(
        DateOnly date,
        string dayType,
        UserAttendanceLog? attendance,
        DateOnly today)
    {
        if (attendance != null)
        {
            if (!string.IsNullOrWhiteSpace(attendance.AttendanceStatus))
            {
                return attendance.AttendanceStatus;
            }

            if (attendance.CheckInTime.HasValue)
            {
                return "CHECKED_IN";
            }
        }

        if (dayType == "HOLIDAY")
        {
            return "HOLIDAY";
        }

        if (dayType == "WEEK_OFF")
        {
            return "WEEK_OFF";
        }

        if (date > today)
        {
            return null;
        }

        if (attendance == null)
        {
            return date < today ? "ABSENT" : null;
        }

        return attendance.CheckInTime.HasValue ? "CHECKED_IN" : "ABSENT";
    }

    private static string MapStatusColor(
        string dayType,
        string? attendanceStatus,
        bool isFuture)
    {
        if (isFuture)
        {
            return "future";
        }

        return attendanceStatus switch
        {
            "HOLIDAY" => "holiday",
            "WEEK_OFF" => "week_off",
            "PRESENT" => "present",
            "HALF_DAY" => "half_day",
            "SHORT_DAY" => "short_day",
            "CHECKED_IN" => "present",
            "ABSENT" => "absent",
            _ => dayType switch
            {
                "HOLIDAY" => "holiday",
                "WEEK_OFF" => "week_off",
                _ => "none",
            },
        };
    }

    private async Task<IReadOnlyDictionary<DateOnly, RegularizationRow>> LoadRegularizationsAsync(
        int userId,
        DateOnly fromDate,
        DateOnly toDate,
        CancellationToken cancellationToken)
    {
        var rows = await _dbContext.AttendanceRegularizations
            .AsNoTracking()
            .Where(x => x.UserId == userId
                && x.LogDate >= fromDate
                && x.LogDate <= toDate
                && x.StatusCode == 1
                && (x.ApprovalStatus == "PENDING"
                    || x.ApprovalStatus == "APPROVED"
                    || x.ApprovalStatus == "REJECTED"))
            .Select(x => new RegularizationRow
            {
                LogDate = x.LogDate,
                ApprovalStatus = x.ApprovalStatus,
                RequestedCorrectionType = x.RequestedCorrectionType,
                Session = x.Session,
            })
            .ToListAsync(cancellationToken);

        return rows
            .GroupBy(x => x.LogDate)
            .ToDictionary(
                group => group.Key,
                group =>
                    group.FirstOrDefault(x => x.ApprovalStatus == "PENDING")
                    ?? group.First());
    }

    private async Task<IReadOnlyList<LeaveApplicationRow>> LoadLeaveApplicationsAsync(
        int userId,
        DateOnly fromDate,
        DateOnly toDate,
        CancellationToken cancellationToken)
    {
        return await (
            from leave in _dbContext.LeaveApplications.AsNoTracking()
            join leaveType in _dbContext.LeaveTypeMasters.AsNoTracking()
                on leave.LeaveTypeId equals leaveType.Id
            where leave.UserId == userId
                && leave.StatusCode == 1
                && leave.ApprovalStatus != "CANCELLED"
                && leave.ApprovalStatus != "REJECTED"
                && leave.FromDate <= toDate
                && leave.ToDate >= fromDate
            select new LeaveApplicationRow
            {
                FromDate = leave.FromDate,
                ToDate = leave.ToDate,
                IsHalfDay = leave.IsHalfDay,
                Session = leave.Session,
                ApprovalStatus = leave.ApprovalStatus,
                LeaveTypeName = leaveType.LeaveTypeName,
            })
            .ToListAsync(cancellationToken);
    }

    private static IReadOnlyList<LeaveBadgeDto> GetLeaveBadgesForDate(
        DateOnly date,
        IReadOnlyList<LeaveApplicationRow> leaveApplications)
    {
        return leaveApplications
            .Where(x => date >= x.FromDate && date <= x.ToDate)
            .Select(x => new LeaveBadgeDto
            {
                LeaveTypeCode = MapLeaveTypeCode(x.LeaveTypeName),
                LeaveTypeName = x.LeaveTypeName,
                IsHalfDay = x.IsHalfDay,
                Session = x.Session,
                IsPending = x.ApprovalStatus == "PENDING",
            })
            .ToList();
    }

    private static string MapLeaveTypeCode(string leaveTypeName)
    {
        var upper = leaveTypeName.ToUpperInvariant();
        if (upper.Contains("PRIV") || upper == "PL")
        {
            return "PL";
        }

        if (upper.Contains("SICK") || upper == "SL")
        {
            return "SL";
        }

        if (upper.Contains("CASUAL") || upper == "CL")
        {
            return "CL";
        }

        return leaveTypeName.Length <= 4
            ? leaveTypeName.ToUpperInvariant()
            : leaveTypeName[..Math.Min(3, leaveTypeName.Length)].ToUpperInvariant();
    }

    private static IReadOnlySet<DayOfWeek> ParseWorkDays(string workDays)
    {
        return workDays
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(x => x.ToUpperInvariant())
            .Select(x => x switch
            {
                "MON" or "MONDAY" => DayOfWeek.Monday,
                "TUE" or "TUESDAY" => DayOfWeek.Tuesday,
                "WED" or "WEDNESDAY" => DayOfWeek.Wednesday,
                "THU" or "THURSDAY" => DayOfWeek.Thursday,
                "FRI" or "FRIDAY" => DayOfWeek.Friday,
                "SAT" or "SATURDAY" => DayOfWeek.Saturday,
                "SUN" or "SUNDAY" => DayOfWeek.Sunday,
                _ => (DayOfWeek?)null,
            })
            .Where(x => x.HasValue)
            .Select(x => x!.Value)
            .ToHashSet();
    }

    private sealed class UserCalendarContext
    {
        public int CompanyId { get; init; }
        public string Timezone { get; init; } = "Asia/Kolkata";
        public string WorkDays { get; init; } = "MON,TUE,WED,THU,FRI";
        public DateOnly Today { get; init; }
    }

    private sealed class RegularizationRow
    {
        public DateOnly LogDate { get; init; }
        public string ApprovalStatus { get; init; } = null!;
        public string RequestedCorrectionType { get; init; } = null!;
        public string? Session { get; init; }
    }

    private sealed class LeaveApplicationRow
    {
        public DateOnly FromDate { get; init; }
        public DateOnly ToDate { get; init; }
        public bool IsHalfDay { get; init; }
        public string? Session { get; init; }
        public string ApprovalStatus { get; init; } = null!;
        public string LeaveTypeName { get; init; } = null!;
    }
}
