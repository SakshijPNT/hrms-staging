using System.Text.Json;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Hrms.NewApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaveTypeController : ControllerBase
{
    private const string SessionKey = "UserSession";
    private readonly ILeaveTypeManager _leaveTypeManager;

    public LeaveTypeController(ILeaveTypeManager leaveTypeManager)
    {
        _leaveTypeManager = leaveTypeManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetLeaveTypes(
        [FromQuery] int companyId,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        if (companyId <= 0)
        {
            return BadRequest(new { message = "A valid companyId is required." });
        }

        var leaveTypes = await _leaveTypeManager.GetLeaveTypesAsync(
            companyId,
            cancellationToken);

        return Ok(leaveTypes);
    }

    private SessionInfoDto? GetSessionInfo()
    {
        var rawSession = HttpContext.Session.GetString(SessionKey);
        return rawSession is null
            ? null
            : JsonSerializer.Deserialize<SessionInfoDto>(rawSession);
    }
}
