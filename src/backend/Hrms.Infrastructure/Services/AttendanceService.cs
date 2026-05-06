using Hrms.Application.DTOs.Attendance;
using Hrms.Application.Interfaces.Repositories;
using Hrms.Application.Interfaces.Services;
using Hrms.Domain.Entities;
using Hrms.Domain.Enums;

namespace Hrms.Infrastructure.Services;

public sealed class AttendanceService(IAttendanceRepository attendanceRepository) : IAttendanceService
{
    private const double PresentThresholdHours = 9d;
    private const double HalfDayThresholdHours = 5d;

    public async Task<IReadOnlyList<AttendanceDto>> GetAttendanceAsync(Guid currentUserId, bool hasElevatedAccess, CancellationToken cancellationToken = default)
    {
        var records = hasElevatedAccess
            ? await attendanceRepository.GetAllAsync(cancellationToken)
            : await attendanceRepository.GetByUserIdAsync(currentUserId, cancellationToken);

        return records.Select(MapToDto).ToList();
    }

    public async Task<AttendanceDto> CheckInAsync(Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var nowUtc = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(nowUtc);

        var existingRecord = await attendanceRepository.GetByUserIdAndDateAsync(currentUserId, today, cancellationToken);
        if (existingRecord is not null && existingRecord.CheckInUtc.HasValue)
        {
            throw new InvalidOperationException("You have already checked in today.");
        }

        if (existingRecord is null)
        {
            var newRecord = new AttendanceRecord
            {
                UserId = currentUserId,
                WorkDate = today,
                CheckInUtc = nowUtc,
                Status = AttendanceStatus.Present,
                Notes = "Checked in"
            };

            await attendanceRepository.AddAsync(newRecord, cancellationToken);
            var added = await attendanceRepository.GetByUserIdAndDateAsync(currentUserId, today, cancellationToken);
            return MapToDto(added!);
        }

        existingRecord.CheckInUtc = nowUtc;
        existingRecord.CheckOutUtc = null;
        existingRecord.Status = AttendanceStatus.Present;
        existingRecord.Notes = "Checked in";
        await attendanceRepository.UpdateAsync(existingRecord, cancellationToken);
        var updatedRecord = await attendanceRepository.GetByUserIdAndDateAsync(currentUserId, today, cancellationToken);
        return MapToDto(updatedRecord!);
    }

    public async Task<AttendanceDto> CheckOutAsync(Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var nowUtc = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(nowUtc);

        var existingRecord = await attendanceRepository.GetByUserIdAndDateAsync(currentUserId, today, cancellationToken)
            ?? throw new InvalidOperationException("Please check in first.");

        if (!existingRecord.CheckInUtc.HasValue)
        {
            throw new InvalidOperationException("Please check in first.");
        }

        existingRecord.CheckOutUtc = nowUtc;

        var workedHours = (existingRecord.CheckOutUtc.Value - existingRecord.CheckInUtc.Value).TotalHours;

        existingRecord.Status = workedHours >= PresentThresholdHours
            ? AttendanceStatus.Present
            : workedHours > HalfDayThresholdHours
                ? AttendanceStatus.HalfDay
                : AttendanceStatus.Absent;
        existingRecord.Notes = $"Total hours: {workedHours:F1}h";

        await attendanceRepository.UpdateAsync(existingRecord, cancellationToken);
        var updatedRecord = await attendanceRepository.GetByUserIdAndDateAsync(currentUserId, today, cancellationToken);
        return MapToDto(updatedRecord!);
    }

    private static AttendanceDto MapToDto(AttendanceRecord record)
    {
        return new AttendanceDto
        {
            Id = record.Id,
            EmployeeName = record.User?.FullName ?? string.Empty,
            EmployeeCode = record.User?.EmployeeProfile?.EmployeeCode ?? string.Empty,
            WorkDate = record.WorkDate,
            CheckInUtc = record.CheckInUtc,
            CheckOutUtc = record.CheckOutUtc,
            Status = record.Status.ToString(),
            Notes = record.Notes ?? string.Empty
        };
    }
}