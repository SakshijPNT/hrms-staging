// Managers/AttendanceManager.cs

using Hrms.NewApi.Data;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Hrms.NewApi.Models;
using Microsoft.EntityFrameworkCore;
using TimeZoneConverter;

namespace Hrms.NewApi.Managers;

public class AttendanceManager : IAttendanceManager
{
    private readonly HrmsDbContext _dbContext;

    public AttendanceManager(HrmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

public async Task<AttendanceResponseDto> CheckInAsync(int userId,CancellationToken cancellationToken = default)
{
    try
    {
        Console.WriteLine("STEP 1");

        var user = await _dbContext.UserMasters
            .FirstOrDefaultAsync(x => x.Id == userId&& x.StatusCode == 1,cancellationToken);
        Console.WriteLine("STEP 2");

        var companyPolicy =await GetCompanyPolicyAsync(user.CompanyId,cancellationToken);
        Console.WriteLine("STEP 3");

        var company =await _dbContext.CompanyMasters
            .FirstOrDefaultAsync(x => x.Id == user.CompanyId,cancellationToken);

        Console.WriteLine("STEP 4");

        Console.WriteLine(company?.Timezone);

        var timezone =
            company?.Timezone ?? "Asia/Kolkata";

        var timezoneInfo =
            TZConvert.GetTimeZoneInfo(timezone);

        Console.WriteLine("STEP 5");

        var utcNow = DateTimeOffset.UtcNow;

        var companyNow =
            TimeZoneInfo.ConvertTime(
                utcNow,
                timezoneInfo);

        Console.WriteLine("STEP 6");

        var today =
            DateOnly.FromDateTime(
                companyNow.DateTime);

        await ValidateWorkDayAsync(
            user.CompanyId,
            today,
            companyPolicy.WorkDays,
            cancellationToken);

        Console.WriteLine("STEP 7");

        var attendance =
            new UserAttendanceLog
            {
                UserId = userId,
                LogDate = today,
                CheckInTime = utcNow,
                AttendanceStatus = "CHECKED_IN",
                StatusCode = 1,
                CreatedBy = userId,
                UpdatedBy = userId,
                CreatedOn = utcNow,
                UpdatedOn = utcNow,
            };

        _dbContext.UserAttendanceLogs.Add(
            attendance);

        Console.WriteLine("STEP 8");

        await _dbContext.SaveChangesAsync(
            cancellationToken);

        Console.WriteLine("STEP 9");

        return MapAttendanceResponse(
            attendance);
    }
    catch (Exception ex)
    {
        Console.WriteLine(ex.ToString());

        throw;
    }
}

    public async Task<AttendanceResponseDto> CheckOutAsync(int userId,CancellationToken cancellationToken = default)
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

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

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

        var now = DateTimeOffset.UtcNow;

        // Multiple checkouts allowed
        // Latest checkout will always overwrite previous one
        attendance.CheckOutTime = now;

        attendance.WorkedMinutes =(int)(attendance.CheckOutTime.Value - attendance.CheckInTime.Value).TotalMinutes;

        var workedHours = attendance.WorkedMinutes / 60m;

        if (workedHours >= companyPolicy.WorkHours)
        {
            attendance.AttendanceStatus = "PRESENT";
        }
        else if (workedHours >= companyPolicy.HalfDayThreshold)
        {
            attendance.AttendanceStatus = "HALF_DAY";
        }
        else
        {
            attendance.AttendanceStatus = "ABSENT";
        }

        var allowedCheckOutTime = companyPolicy.ShiftEnd.AddMinutes(-companyPolicy.CheckOutGracePeriod);

        attendance.IsEarlyLeave =TimeOnly.FromDateTime(now.UtcDateTime) < allowedCheckOutTime;

        attendance.UpdatedBy = userId;
        attendance.UpdatedOn = now;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapAttendanceResponse(attendance);
    }

    public async Task<AttendanceResponseDto?> GetTodayAttendanceAsync(int userId,CancellationToken cancellationToken = default)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var attendance = await _dbContext.UserAttendanceLogs
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.UserId == userId
                    && x.LogDate == today
                    && x.StatusCode == 1,
                cancellationToken);

        return attendance == null
            ? null
            : MapAttendanceResponse(attendance);
    }

    private async Task<CompanyPolicies> GetCompanyPolicyAsync(int companyId,CancellationToken cancellationToken)
    {
        return await _dbContext.CompanyPolicies
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.CompanyId == companyId
                    && x.StatusCode == 1,
                cancellationToken)
            ?? throw new InvalidOperationException("Company policy not found.");
    }

    private async Task ValidateWorkDayAsync(int companyId,DateOnly date,string workDays,CancellationToken cancellationToken)
    {
        var allowedDays = ParseWorkDays(workDays);

        if (!allowedDays.Contains(date.DayOfWeek))
        {
            throw new InvalidOperationException("Today is a company week-off.");
        }

        var holidayExists = await _dbContext.HolidayLists
            .AnyAsync(
                x => x.CompanyId == companyId
                    && x.HolidayDate == date
                    && x.StatusCode == 1,
                cancellationToken);

        if (holidayExists)
        {
            throw new InvalidOperationException("Today is a company holiday.");
        }
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
                "MON" => DayOfWeek.Monday,
                "TUE" => DayOfWeek.Tuesday,
                "WED" => DayOfWeek.Wednesday,
                "THU" => DayOfWeek.Thursday,
                "FRI" => DayOfWeek.Friday,
                "SAT" => DayOfWeek.Saturday,
                "SUN" => DayOfWeek.Sunday,
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
            LogDate = attendance.LogDate,
            CheckInTime = attendance.CheckInTime,
            CheckOutTime = attendance.CheckOutTime,
            WorkedMinutes = attendance.WorkedMinutes,
            WorkedHours = attendance.WorkedMinutes / 60m,
            IsLate = attendance.IsLate,
            IsEarlyLeave = attendance.IsEarlyLeave,
            AttendanceStatus = attendance.AttendanceStatus,
            Remarks = attendance.Remarks,
        };
    }
}