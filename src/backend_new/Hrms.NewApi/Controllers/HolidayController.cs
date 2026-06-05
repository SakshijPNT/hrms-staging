using System.Text.Json;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Hrms.NewApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HolidayController : ControllerBase
{
    private const string SessionKey = "UserSession";
    private readonly IHolidayManager _holidayManager;

    public HolidayController(IHolidayManager holidayManager)
    {
        _holidayManager = holidayManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetHolidays(
        [FromQuery] int companyId,
        [FromQuery] int? year,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        var holidays = await _holidayManager.GetHolidaysAsync(
            companyId,
            year,
            cancellationToken);

        return Ok(holidays);
    }

    [HttpPost]
    public async Task<IActionResult> CreateHoliday(
        [FromBody] HolidayCreateDto request,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        try
        {
            var holiday = await _holidayManager.CreateHolidayAsync(
                request,
                session.UserId,
                cancellationToken);

            return Ok(holiday);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("bulk")]
    public async Task<IActionResult> BulkCreateHolidays(
        [FromBody] HolidayBulkCreateDto request,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        try
        {
            var holidays = await _holidayManager.BulkCreateHolidaysAsync(
                request,
                session.UserId,
                cancellationToken);

            return Ok(holidays);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateHoliday(
        int id,
        [FromBody] HolidayUpdateDto request,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        if (id != request.Id)
        {
            return BadRequest(new { message = "Holiday id mismatch." });
        }

        try
        {
            var holiday = await _holidayManager.UpdateHolidayAsync(
                request,
                session.UserId,
                cancellationToken);

            return Ok(holiday);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteHoliday(
        int id,
        [FromQuery] int companyId,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        try
        {
            await _holidayManager.DeleteHolidayAsync(
                id,
                companyId,
                cancellationToken);

            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private SessionInfoDto? GetSessionInfo()
    {
        var rawSession = HttpContext.Session.GetString(SessionKey);
        return rawSession is null
            ? null
            : JsonSerializer.Deserialize<SessionInfoDto>(rawSession);
    }
}
