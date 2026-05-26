// Interfaces/IAttendanceManager.cs

using Hrms.NewApi.Dtos;

namespace Hrms.NewApi.Interfaces;

public interface IAttendanceManager
{
    Task<AttendanceResponseDto> CheckInAsync(int userId,CancellationToken cancellationToken = default);

    Task<AttendanceResponseDto> CheckOutAsync(int userId,CancellationToken cancellationToken = default);

   Task<AttendanceResponseDto?> GetTodayAttendanceAsync(int userId,CancellationToken cancellationToken = default);
}