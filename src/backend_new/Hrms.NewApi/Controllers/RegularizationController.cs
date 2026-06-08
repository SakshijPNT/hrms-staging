using System.Globalization;
using System.Text.Json;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Hrms.NewApi.Controllers;

[ApiController]
[Route("api/regularization")]
public class RegularizationController : ControllerBase
{
    private const string SessionKey = "UserSession";
    private readonly IRegularizationManager _regularizationManager;

    public RegularizationController(IRegularizationManager regularizationManager)
    {
        _regularizationManager = regularizationManager;
    }

    [HttpGet("preview")]
    public async Task<IActionResult> GetPreview(
        [FromQuery] string date,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        if (!TryParseDate(date, out var logDate))
        {
            return BadRequest(new { message = "Invalid date format. Use yyyy-MM-dd." });
        }

        try
        {
            var preview = await _regularizationManager.GetPreviewAsync(
                session.UserId,
                session.CompanyId,
                logDate,
                cancellationToken);

            return Ok(preview);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("applications")]
    public async Task<IActionResult> CreateApplication(
        [FromBody] CreateRegularizationDto request,
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
            var created = await _regularizationManager.CreateAsync(
                session.UserId,
                session.CompanyId,
                request,
                cancellationToken);

            return CreatedAtAction(nameof(GetMyApplications), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("applications")]
    public async Task<IActionResult> GetMyApplications(CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        var items = await _regularizationManager.GetMyRequestsAsync(
            session.UserId,
            cancellationToken);

        return Ok(items);
    }

    [HttpPatch("applications/{id:int}/cancel")]
    public async Task<IActionResult> CancelApplication(
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
            var result = await _regularizationManager.CancelAsync(
                id,
                session.UserId,
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

    [HttpGet("pending-approvals")]
    [HttpGet("manager-requests")]
    public async Task<IActionResult> GetManagerRegularizationRequests(
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        var items = await _regularizationManager.GetManagerRegularizationRequestsAsync(
            session.UserId,
            session.CompanyId,
            cancellationToken);

        return Ok(items);
    }

    [HttpPatch("applications/{id:int}/approve")]
    public async Task<IActionResult> ApproveApplication(
        int id,
        [FromBody] ReviewRegularizationDto request,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        try
        {
            var result = await _regularizationManager.ApproveAsync(
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
    public async Task<IActionResult> RejectApplication(
        int id,
        [FromBody] ReviewRegularizationDto request,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        try
        {
            var result = await _regularizationManager.RejectAsync(
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

    [HttpGet("admin/pending-queue")]
    public async Task<IActionResult> GetAdminPendingQueue(
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        var items = await _regularizationManager.GetAdminPendingQueueAsync(
            session.UserId,
            session.CompanyId,
            cancellationToken);

        return Ok(items);
    }

    [HttpPatch("admin/applications/{id:int}/approve")]
    public async Task<IActionResult> AdminApproveApplication(
        int id,
        [FromBody] ReviewRegularizationDto request,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        try
        {
            var result = await _regularizationManager.AdminApproveAsync(
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

    [HttpPatch("admin/applications/{id:int}/reject")]
    public async Task<IActionResult> AdminRejectApplication(
        int id,
        [FromBody] ReviewRegularizationDto request,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        try
        {
            var result = await _regularizationManager.AdminRejectAsync(
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

    [HttpGet("admin/manual-correction/preview")]
    public async Task<IActionResult> GetAdminManualCorrectionPreview(
        [FromQuery] int userId,
        [FromQuery] string date,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        if (!TryParseDate(date, out var logDate))
        {
            return BadRequest(new { message = "Invalid date format. Use yyyy-MM-dd." });
        }

        try
        {
            var preview = await _regularizationManager.GetAdminManualCorrectionPreviewAsync(
                userId,
                session.CompanyId,
                logDate,
                cancellationToken);

            return Ok(preview);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("admin/manual-correction")]
    public async Task<IActionResult> ApplyAdminManualCorrection(
        [FromBody] CreateAdminManualCorrectionDto request,
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
            var result = await _regularizationManager.ApplyAdminManualCorrectionAsync(
                session.UserId,
                session.CompanyId,
                request,
                cancellationToken);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private static bool TryParseDate(string date, out DateOnly logDate)
    {
        return DateOnly.TryParseExact(
            date,
            "yyyy-MM-dd",
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out logDate);
    }

    private SessionInfoDto? GetSessionInfo()
    {
        var rawSession = HttpContext.Session.GetString(SessionKey);
        return rawSession is null
            ? null
            : JsonSerializer.Deserialize<SessionInfoDto>(rawSession);
    }
}
