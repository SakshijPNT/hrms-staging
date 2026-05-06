using Hrms.Api.Extensions;
using Hrms.Application.DTOs.Attendance;
using Hrms.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hrms.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class AttendanceController(IAttendanceService attendanceService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AttendanceDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAttendance(CancellationToken cancellationToken)
    {
        var result = await attendanceService.GetAttendanceAsync(User.GetUserId(), User.HasElevatedAccess(), cancellationToken);
        return Ok(result);
    }

    [HttpPost("check-in")]
    [ProducesResponseType(typeof(AttendanceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CheckIn(CancellationToken cancellationToken)
    {
        try
        {
            var result = await attendanceService.CheckInAsync(User.GetUserId(), cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }

    [HttpPost("check-out")]
    [ProducesResponseType(typeof(AttendanceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CheckOut(CancellationToken cancellationToken)
    {
        try
        {
            var result = await attendanceService.CheckOutAsync(User.GetUserId(), cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException exception)
        {
            return Conflict(new { message = exception.Message });
        }
    }
}