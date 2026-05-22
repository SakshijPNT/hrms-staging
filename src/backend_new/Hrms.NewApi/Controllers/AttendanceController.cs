// Controllers/AttendanceController.cs

using Hrms.NewApi.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hrms.NewApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceManager _attendanceManager;

    public AttendanceController(IAttendanceManager attendanceManager)
    {
        _attendanceManager = attendanceManager;
    }

    [HttpPost("check-in")]
    public async Task<IActionResult> CheckIn(CancellationToken cancellationToken)
    {
        // Example:
        // Get logged-in user id from JWT token/claims

        var userIdClaim = User.FindFirst("UserId")?.Value;

        if (string.IsNullOrWhiteSpace(userIdClaim))
        {
            return Unauthorized("User id not found in token.");
        }

        var userId = int.Parse(userIdClaim);

        var response = await _attendanceManager.CheckInAsync(userId,cancellationToken);

        return Ok(response);
    }

    [HttpPost("check-out")]
    public async Task<IActionResult> CheckOut(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst("UserId")?.Value;

        if (string.IsNullOrWhiteSpace(userIdClaim))
        {
            return Unauthorized("User id not found in token.");
        }

        var userId = int.Parse(userIdClaim);

        var response = await _attendanceManager.CheckOutAsync(userId,cancellationToken);

        return Ok(response);
    }

    [HttpGet("today")]
    public async Task<IActionResult> GetTodayAttendance(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst("UserId")?.Value;

        if (string.IsNullOrWhiteSpace(userIdClaim))
        {
            return Unauthorized("User id not found in token.");
        }

        var userId = int.Parse(userIdClaim);

        var response = await _attendanceManager.GetTodayAttendanceAsync(userId,cancellationToken);

        if (response == null)
        {
            return NotFound(
                "Attendance not found for today.");
        }

        return Ok(response);
    }
}