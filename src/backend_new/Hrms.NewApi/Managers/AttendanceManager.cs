// Managers/AttendanceManager.cs

using Hrms.NewApi.Data;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Hrms.NewApi.Models;
using Hrms.NewApi.Support;
using Microsoft.EntityFrameworkCore;
using TimeZoneConverter;

namespace Hrms.NewApi.Managers;

public class AttendanceManager : IAttendanceManager
{
    // US-09 week-off/holiday rules. Set true for production; false allows check-in on any day for testing.
    private const bool EnforceWorkDayValidation = false;

    private readonly HrmsDbContext _dbContext;

    public AttendanceManager(HrmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<AttendanceResponseDto> CheckInAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.UserMasters
            .FirstOrDefaultAsync(
                x => x.Id == userId && x.StatusCode == 1,
                cancellationToken)
            ?? throw new InvalidOperationException(
                $"User with id {userId} does not exist.");

        var companyPolicy = await GetCompanyPolicyAsync(
            user.CompanyId,
            cancellationToken);

        var company = await _dbContext.CompanyMasters
            .FirstOrDefaultAsync(
                x => x.Id == user.CompanyId,
                cancellationToken);

        var timezoneInfo = GetTimezoneInfo(company?.Timezone);
        var utcNow = DateTimeOffset.UtcNow;
        var companyNow = ToCompanyLocal(utcNow, timezoneInfo);
        var today = DateOnly.FromDateTime(companyNow.DateTime);

        if (EnforceWorkDayValidation)
        {
            await ValidateWorkDayAsync(
                user.CompanyId,
                today,
                companyPolicy.WorkDays,
                cancellationToken);
        }

        var existingAttendance = await _dbContext.UserAttendanceLogs
            .FirstOrDefaultAsync(
                x => x.UserId == userId
                    && x.LogDate == today
                    && x.StatusCode == 1,
                cancellationToken);

        if (existingAttendance != null)
        {
            if (existingAttendance.CheckInTime.HasValue)
            {
                existingAttendance.IsLate = IsCheckInLate(
                    existingAttendance.CheckInTime.Value,
                    companyPolicy,
                    timezoneInfo);
                existingAttendance.UpdatedBy = userId;
                existingAttendance.UpdatedOn = utcNow;
                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            return MapAttendanceResponse(existingAttendance);
        }

        var attendance = new UserAttendanceLog
        {
            UserId = userId,
            LogDate = today,
            CheckInTime = utcNow,
            IsLate = IsCheckInLate(utcNow, companyPolicy, timezoneInfo),
            AttendanceStatus = "CHECKED_IN",
            StatusCode = 1,
            CreatedBy = userId,
            UpdatedBy = userId,
            CreatedOn = utcNow,
            UpdatedOn = utcNow,
        };

        _dbContext.UserAttendanceLogs.Add(attendance);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapAttendanceResponse(attendance);
    }
   


    public async Task<AttendanceResponseDto> CheckOutAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.UserMasters
            .FirstOrDefaultAsync(
                x => x.Id == userId && x.StatusCode == 1,
                cancellationToken)
            ?? throw new InvalidOperationException(
                $"User with id {userId} does not exist.");

        var companyPolicy = await GetCompanyPolicyAsync(
            user.CompanyId,
            cancellationToken);

        var company = await _dbContext.CompanyMasters
            .FirstOrDefaultAsync(
                x => x.Id == user.CompanyId,
                cancellationToken);

        var timezoneInfo = GetTimezoneInfo(company?.Timezone);
        var now = DateTimeOffset.UtcNow;
        var companyNow = ToCompanyLocal(now, timezoneInfo);
        var today = DateOnly.FromDateTime(companyNow.DateTime);

        var attendance = await _dbContext.UserAttendanceLogs
            .FirstOrDefaultAsync(
                x => x.UserId == userId
                    && x.LogDate == today
                    && x.StatusCode == 1,
                cancellationToken)
            ?? throw new InvalidOperationException(
                "User has not checked in today.");

        if (attendance.CheckInTime == null)
        {
            throw new InvalidOperationException(
                "Check-in time not found.");
        }

        attendance.CheckOutTime = now;
        attendance.WorkedMinutes = (int)(
            attendance.CheckOutTime.Value - attendance.CheckInTime.Value)
            .TotalMinutes;

        attendance.IsLate = IsCheckInLate(
            attendance.CheckInTime.Value,
            companyPolicy,
            timezoneInfo);

        var actualCheckOutTime = TimeOnly.FromDateTime(companyNow.DateTime);
        attendance.IsEarlyLeave = IsCheckOutEarly(
            actualCheckOutTime,
            companyPolicy);

        attendance.AttendanceStatus = ResolveAttendanceStatus(
            attendance.WorkedMinutes,
            attendance.CheckInTime.HasValue,
            attendance.IsEarlyLeave,
            companyPolicy);

        attendance.UpdatedBy = userId;
        attendance.UpdatedOn = now;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapAttendanceResponse(attendance);
    }

    public async Task<TodayAttendanceResponseDto> GetTodayAttendanceAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _dbContext.UserMasters
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == userId && x.StatusCode == 1,
                cancellationToken)
            ?? throw new InvalidOperationException(
                $"User with id {userId} does not exist.");

        var companyPolicy = await GetCompanyPolicyAsync(
            user.CompanyId,
            cancellationToken);

        var company = await _dbContext.CompanyMasters
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == user.CompanyId,
                cancellationToken);

        var timezoneInfo = GetTimezoneInfo(company?.Timezone);
        var companyNow = ToCompanyLocal(DateTimeOffset.UtcNow, timezoneInfo);
        var today = DateOnly.FromDateTime(companyNow.DateTime);

        var dayContext = await ResolveDayContextAsync(
            user.CompanyId,
            today,
            companyPolicy.WorkDays,
            cancellationToken);

        var attendance = await _dbContext.UserAttendanceLogs
            .FirstOrDefaultAsync(
                x => x.UserId == userId
                    && x.LogDate == today
                    && x.StatusCode == 1,
                cancellationToken);

        if (attendance?.CheckInTime.HasValue == true)
        {
            var isLate = IsCheckInLate(
                attendance.CheckInTime.Value,
                companyPolicy,
                timezoneInfo);

            if (attendance.IsLate != isLate)
            {
                attendance.IsLate = isLate;
                attendance.UpdatedBy = userId;
                attendance.UpdatedOn = DateTimeOffset.UtcNow;
                await _dbContext.SaveChangesAsync(cancellationToken);
            }
        }

        return new TodayAttendanceResponseDto
        {
            LogDate = today,
            DayType = dayContext.DayType,
            IsCheckInAllowed = EnforceWorkDayValidation
                ? dayContext.IsCheckInAllowed
                : true,
            DayLabel = dayContext.DayLabel,
            Attendance = attendance == null
                ? null
                : MapAttendanceResponse(attendance),
        };
    }

    public async Task<AttendanceResponseDto?> GetAttendanceByDateAsync(
        int userId,
        DateOnly date,
        CancellationToken cancellationToken = default)
    {
        var attendance = await _dbContext.UserAttendanceLogs
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.UserId == userId
                    && x.LogDate == date
                    && x.StatusCode == 1,
                cancellationToken);

        return attendance == null
            ? null
            : MapAttendanceResponse(attendance);
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

    private async Task ValidateWorkDayAsync(
        int companyId,
        DateOnly date,
        string workDays,
        CancellationToken cancellationToken)
    {
        var dayContext = await ResolveDayContextAsync(
            companyId,
            date,
            workDays,
            cancellationToken);

        if (!dayContext.IsCheckInAllowed)
        {
            throw new InvalidOperationException(dayContext.DayLabel!);
        }
    }

    private async Task<(string DayType, bool IsCheckInAllowed, string? DayLabel)> ResolveDayContextAsync(
        int companyId,
        DateOnly date,
        string workDays,
        CancellationToken cancellationToken)
    {
        var allowedDays = ParseWorkDays(workDays);

        if (!allowedDays.Contains(date.DayOfWeek))
        {
            return ("WEEK_OFF", false, "Today is a company week-off.");
        }

        var holidayExists = await _dbContext.HolidayLists
            .AnyAsync(
                x => x.CompanyId == companyId
                    && x.HolidayDate == date
                    && x.StatusCode == 1,
                cancellationToken);

        if (holidayExists)
        {
            return ("HOLIDAY", false, "Today is a company holiday.");
        }

        return ("WORKING", true, null);
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
        var companyLocal = ToCompanyLocal(utcTime, timezoneInfo);
        return TimeOnly.FromDateTime(companyLocal.DateTime);
    }

    private static TimeOnly GetAllowedCheckInTime(CompanyPolicies policy)
    {
        return policy.ShiftStart.AddMinutes(policy.CheckInGracePeriod);
    }

    private static TimeOnly GetAllowedCheckOutTime(CompanyPolicies policy)
    {
        return policy.ShiftEnd.AddMinutes(-policy.CheckOutGracePeriod);
    }

    private static bool IsCheckInLate(
        DateTimeOffset checkInUtc,
        CompanyPolicies policy,
        TimeZoneInfo timezoneInfo)
    {
        var actualCheckInTime = ToCompanyLocalTime(checkInUtc, timezoneInfo);
        return actualCheckInTime > GetAllowedCheckInTime(policy);
    }

    private static bool IsCheckOutEarly(
        TimeOnly actualCheckOutTime,
        CompanyPolicies policy)
    {
        return actualCheckOutTime < GetAllowedCheckOutTime(policy);
    }

    private static string ResolveAttendanceStatus(
        int workedMinutes,
        bool hasCheckIn,
        bool isEarlyLeave,
        CompanyPolicies policy)
    {
        return AttendanceStatusHelper.ResolveFromWorkedMinutes(
            workedMinutes,
            hasCheckIn,
            isEarlyLeave,
            policy);
    }

    private static IReadOnlySet<DayOfWeek> ParseWorkDays(string workDays)
    {
        return workDays
            .Split(
                ',',
                StringSplitOptions.RemoveEmptyEntries
                | StringSplitOptions.TrimEntries)
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
                _ => throw new InvalidOperationException(
                    $"Invalid work day: {x}")
            })
            .ToHashSet();
    }

    private static AttendanceResponseDto MapAttendanceResponse(UserAttendanceLog attendance)
    {
        return new AttendanceResponseDto
        {
            Id = attendance.Id,
            UserId = attendance.UserId,
            LogDate = attendance.LogDate,
            CheckInTime = attendance.CheckInTime,
            CheckOutTime = attendance.CheckOutTime,
            WorkedMinutes = attendance.WorkedMinutes,
            WorkedHours = Math.Round(
                attendance.WorkedMinutes / 60m,
                1,
                MidpointRounding.AwayFromZero),
            IsLate = attendance.IsLate,
            IsEarlyLeave = attendance.IsEarlyLeave,
            AttendanceStatus = attendance.AttendanceStatus,
            Remarks = attendance.Remarks,
        };
    }
}
