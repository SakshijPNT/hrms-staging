using System.Text.Json;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Hrms.NewApi.Controllers;

[ApiController]
[Route("api/user-leaves")]
public class UserLeavesController : ControllerBase
{
    private const string SessionKey = "UserSession";
    private readonly IUserLeaveManager _userLeaveManager;

    public UserLeavesController(IUserLeaveManager userLeaveManager)
    {
        _userLeaveManager = userLeaveManager;
    }

    [HttpPost("applications")]
    public async Task<IActionResult> ApplyLeave(
        [FromBody] ApplyLeaveApplicationDto request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        try
        {
            var leaveApplication = await _userLeaveManager.ApplyLeaveAsync(
                session.UserId,
                session.CompanyId,
                request,
                cancellationToken);

            return CreatedAtAction(nameof(GetMyLeaveApplications), new { id = leaveApplication.Id }, leaveApplication);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("applications")]
    public async Task<IActionResult> GetMyLeaveApplications(CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        var leaveApplications = await _userLeaveManager.GetLeaveApplicationsForUserAsync(
            session.UserId,
            cancellationToken);

        return Ok(leaveApplications);
    }

    [HttpPatch("applications/{id:int}/cancel")]
    public async Task<IActionResult> CancelLeave(int id, CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
            return Unauthorized(new { message = "No active session." });

        try
        {
            var result = await _userLeaveManager.CancelLeaveAsync(id, session.UserId, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private SessionInfoDto? GetSessionInfo()
    {
        var rawSession = HttpContext.Session.GetString(SessionKey);
        return rawSession is null ? null : JsonSerializer.Deserialize<SessionInfoDto>(rawSession);
    }
}
