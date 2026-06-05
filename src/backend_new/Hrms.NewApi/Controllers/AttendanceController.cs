// Controllers/AttendanceController.cs

using Hrms.NewApi.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Hrms.NewApi.Dtos;

namespace Hrms.NewApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceManager _attendanceManager;
    private readonly ICalendarManager _calendarManager;

    private const string SessionKey = "UserSession";

    public AttendanceController(
        IAttendanceManager attendanceManager,
        ICalendarManager calendarManager)
    {
        _attendanceManager = attendanceManager;
        _calendarManager = calendarManager;
    }

    [HttpPost("check-in")]
    public async Task<IActionResult> CheckIn(CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();

        if (session is null)
        {
            return Unauthorized(new
            {
                message = "No active session."
            });
        }

        try
        {
            var response = await _attendanceManager.CheckInAsync(
                session.UserId,
                cancellationToken);

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }


    [HttpPost("check-out")]
    public async Task<IActionResult> CheckOut(CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();

        if (session is null)
        {
            return Unauthorized(new
            {
                message = "No active session."
            });
        }

        try
        {
            var response = await _attendanceManager.CheckOutAsync(
                session.UserId,
                cancellationToken);

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("today")]
    public async Task<IActionResult> GetTodayAttendance(CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();

        if (session is null)
        {
            return Unauthorized(new
            {
                message = "No active session."
            });
        }

        var response = await _attendanceManager.GetTodayAttendanceAsync(
            session.UserId,
            cancellationToken);

        return Ok(response);
    }

    [HttpGet("calendar/{year:int}/{month:int}")]
    public async Task<IActionResult> GetMonthlyCalendar(
        int year,
        int month,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();

        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        try
        {
            var response = await _calendarManager.GetMonthlyCalendarAsync(
                session.UserId,
                year,
                month,
                cancellationToken);

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("day")]
    public async Task<IActionResult> GetDayDetail(
        [FromQuery] string date,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();

        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        if (!DateOnly.TryParseExact(
                date,
                "yyyy-MM-dd",
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None,
                out var parsedDate))
        {
            return BadRequest(new { message = "Invalid date format. Use yyyy-MM-dd." });
        }

        try
        {
            var response = await _calendarManager.GetDayDetailAsync(
                session.UserId,
                parsedDate,
                cancellationToken);

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private SessionInfoDto? GetSessionInfo()
{
    var rawSession =
        HttpContext.Session.GetString(SessionKey);

    return rawSession is null
        ? null
        : JsonSerializer.Deserialize<SessionInfoDto>(
            rawSession);
}
}