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

    [HttpGet("applications/monthly-preview")]
    public async Task<IActionResult> PreviewLeaveApplicationMonthly(
        [FromQuery] ApplyLeaveApplicationDto request,
        [FromQuery] int? excludeLeaveId,
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
            var preview = await _userLeaveManager.PreviewLeaveApplicationMonthlyAsync(
                session.UserId,
                session.CompanyId,
                request,
                excludeLeaveId,
                cancellationToken);

            return Ok(preview);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
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

    [HttpGet("balances")]
    public async Task<IActionResult> GetLeaveBalances(CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        var leaveBalances = await _userLeaveManager.GetUserLeaveBalances(
            session.UserId,
            session.CompanyId,
            cancellationToken);

        return Ok(leaveBalances);
    }

    [HttpGet("balances/{leaveTypeId:int}/detail")]
    public async Task<IActionResult> GetLeaveBalanceDetail(
        int leaveTypeId,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        try
        {
            var detail = await _userLeaveManager.GetUserLeaveBalanceDetailAsync(
                session.UserId,
                session.CompanyId,
                leaveTypeId,
                cancellationToken);

            return Ok(detail);
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

    [HttpPut("applications/{id:int}")]
    public async Task<IActionResult> UpdateLeaveApplication(
        int id,
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
            var result = await _userLeaveManager.UpdateLeaveApplicationAsync(
                id,
                session.UserId,
                session.CompanyId,
                request,
                cancellationToken);

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

    [HttpDelete("applications/{id:int}")]
    public async Task<IActionResult> DeleteLeaveApplication(
        int id,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        try
        {
            await _userLeaveManager.DeleteLeaveApplicationAsync(
                id,
                session.UserId,
                cancellationToken);

            return NoContent();
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
    

    [HttpGet("leave-types")]
    public async Task<IActionResult> GetLeaveTypes(CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(
                new { message = "No active session." });
        }

        var leaveTypes =
            await _userLeaveManager.GetLeaveTypesAsync(
                session.CompanyId,
                cancellationToken);

        return Ok(leaveTypes);
    }

    [HttpGet("pending-approvals")]
    public async Task<IActionResult> GetPendingApprovals(CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        var items = await _userLeaveManager.GetPendingLeaveApplicationsForManagerAsync(
            session.UserId,
            session.CompanyId,
            cancellationToken);

        return Ok(items);
    }

    [HttpPatch("applications/{id:int}/approve")]
    public async Task<IActionResult> ApproveLeaveApplication(
        int id,
        [FromBody] ReviewLeaveApplicationDto request,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        try
        {
            var result = await _userLeaveManager.ApproveLeaveAsync(
                id,
                session.UserId,
                session.CompanyId,
                request,
                cancellationToken);

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

    [HttpPatch("applications/{id:int}/reject")]
    public async Task<IActionResult> RejectLeaveApplication(
        int id,
        [FromBody] ReviewLeaveApplicationDto request,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        try
        {
            var result = await _userLeaveManager.RejectLeaveAsync(
                id,
                session.UserId,
                session.CompanyId,
                request,
                cancellationToken);

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
}
