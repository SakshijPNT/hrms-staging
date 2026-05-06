using Hrms.Application.DTOs.Attendance;

namespace Hrms.Application.Interfaces.Services;

public interface IAttendanceService
{
    Task<IReadOnlyList<AttendanceDto>> GetAttendanceAsync(Guid currentUserId, bool hasElevatedAccess, CancellationToken cancellationToken = default);
    Task<AttendanceDto> CheckInAsync(Guid currentUserId, CancellationToken cancellationToken = default);
    Task<AttendanceDto> CheckOutAsync(Guid currentUserId, CancellationToken cancellationToken = default);
}