namespace Hrms.Application.DTOs.Attendance;

public sealed class AttendanceDto
{
    public Guid Id { get; init; }
    public string EmployeeName { get; init; } = string.Empty;
    public string EmployeeCode { get; init; } = string.Empty;
    public DateOnly WorkDate { get; init; }
    public DateTime? CheckInUtc { get; init; }
    public DateTime? CheckOutUtc { get; init; }
    public string Status { get; init; } = string.Empty;
    public string Notes { get; init; } = string.Empty;
}