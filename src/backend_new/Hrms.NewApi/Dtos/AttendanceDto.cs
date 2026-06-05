// Dtos/AttendanceDtos.cs

namespace Hrms.NewApi.Dtos;

public class AttendanceActionDto
{
    // Optional for future remarks/location/device info
    public string? Remarks { get; set; }
}

public class AttendanceResponseDto
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public DateOnly LogDate { get; set; }
    public DateTimeOffset? CheckInTime { get; set; }
    public DateTimeOffset? CheckOutTime { get; set; }
    public int WorkedMinutes { get; set; }
    public decimal WorkedHours { get; set; }
    public bool IsLate { get; set; }
    public bool IsEarlyLeave { get; set; }
    public string AttendanceStatus { get; set; } = null!;
    public string? Remarks { get; set; }
}

public class AttendanceHistoryDto
{
    public int Id { get; set; }
    public DateOnly LogDate { get; set; }
    public DateTimeOffset? CheckInTime { get; set; }
    public DateTimeOffset? CheckOutTime { get; set; }
    public int WorkedMinutes { get; set; }
    public decimal WorkedHours { get; set; }
    public bool IsLate { get; set; }
    public bool IsEarlyLeave { get; set; }
    public string AttendanceStatus { get; set; } = null!;
}

public class AttendanceSummaryDto
{
    public int TotalPresentDays { get; set; }
    public int TotalHalfDays { get; set; }
    public int TotalAbsentDays { get; set; }
    public int TotalLateDays { get; set; }
    public decimal TotalWorkedHours { get; set; }
}

public class TodayAttendanceResponseDto
{
    public DateOnly LogDate { get; set; }
    public string DayType { get; set; } = "WORKING";
    public bool IsCheckInAllowed { get; set; } = true;
    public string? DayLabel { get; set; }
    public AttendanceResponseDto? Attendance { get; set; }
}