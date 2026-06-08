namespace Hrms.NewApi.Dtos;

public class MonthlyCalendarResponseDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string Timezone { get; set; } = null!;
    public IReadOnlyList<CalendarDayDto> Days { get; set; } = Array.Empty<CalendarDayDto>();
}

public class CalendarDayDto
{
    public DateOnly Date { get; set; }
    public string? AttendanceStatus { get; set; }
    public string StatusColor { get; set; } = "none";
    public string? HolidayName { get; set; }
    public IReadOnlyList<LeaveBadgeDto> LeaveBadges { get; set; } = Array.Empty<LeaveBadgeDto>();
    public bool IsFuture { get; set; }
    public bool IsRegularized { get; set; }
    public bool HasRegularizationPending { get; set; }
}

public class LeaveBadgeDto
{
    public string LeaveTypeCode { get; set; } = null!;
    public string LeaveTypeName { get; set; } = null!;
    public bool IsHalfDay { get; set; }
    public string? Session { get; set; }
    public bool IsPending { get; set; }
}

public class DayDetailResponseDto
{
    public DateOnly Date { get; set; }
    public string DayType { get; set; } = "WORKING";
    public string? HolidayName { get; set; }
    public AttendanceResponseDto? Attendance { get; set; }
    public DateTimeOffset? CheckInTime { get; set; }
    public DateTimeOffset? CheckOutTime { get; set; }
    public int WorkedMinutes { get; set; }
    public decimal WorkedHours { get; set; }
    public string? AttendanceStatus { get; set; }
    public bool IsLate { get; set; }
    public bool IsEarlyLeave { get; set; }
    public IReadOnlyList<LeaveBadgeDto> LeaveInfo { get; set; } = Array.Empty<LeaveBadgeDto>();
}

public class MonthlyAttendanceLogResponseDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public string Timezone { get; set; } = null!;
    public DateOnly Today { get; set; }
    public IReadOnlyList<AttendanceLogDayDto> Days { get; set; } = Array.Empty<AttendanceLogDayDto>();
}

public class AttendanceLogDayDto
{
    public DateOnly Date { get; set; }
    public string DayType { get; set; } = "WORKING";
    public string? DisplayStatus { get; set; }
    public string? HolidayName { get; set; }
    public DateTimeOffset? CheckInTime { get; set; }
    public DateTimeOffset? CheckOutTime { get; set; }
    public int WorkedMinutes { get; set; }
    public bool IsFuture { get; set; }
    public bool IsToday { get; set; }
    public IReadOnlyList<LeaveBadgeDto> LeaveBadges { get; set; } = Array.Empty<LeaveBadgeDto>();
}
