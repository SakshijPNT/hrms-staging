using System.Text.Json;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hrms.NewApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PolicyController : ControllerBase
{
    private const string SessionKey = "UserSession";

    private readonly IPolicyManager _policyManager;

    public PolicyController(IPolicyManager policyManager)
    {
        _policyManager = policyManager;
    }

    [HttpPost("setup")]
    public async Task<IActionResult> CreatePolicySetup(
        [FromBody] PolicySetupCreateDto request,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();

        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        try
        {
            var result = await _policyManager.CreatePolicySetupAsync(
                request,
                session.UserId,
                cancellationToken);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = GetErrorMessage(ex) });
        }
    }

    [HttpPut("setup")]
    public async Task<IActionResult> UpdatePolicySetup(
        [FromBody] PolicySetupUpdateDto request,
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();

        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        try
        {
            var result = await _policyManager.UpdatePolicySetupAsync(
                request,
                session.UserId,
                cancellationToken);

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = GetErrorMessage(ex) });
        }
    }

    [HttpGet("company-context")]
    public async Task<IActionResult> GetCompanyContext(
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

        try
        {
            var context = await _policyManager.GetCompanyContextAsync(
                companyId,
                cancellationToken);

            return Ok(context);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("CreatePolicy")]
    public async Task<IActionResult> CreatePolicy([FromBody] PolicyCreateDto request,CancellationToken cancellationToken)
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
            var result =
                await _policyManager.CreatePolicyAsync(request,session.UserId,cancellationToken);

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = ex.Message
            });
        }
    }

     [HttpGet("HasPolicyAccess")]
    public async Task<IActionResult> HasPolicyAccess(
        CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();

        if (session is null)
        {
            return Unauthorized(new
            {
                message = "No active session."
            });
        }

        var hasAccess =
            await _policyManager.HasPolicyAccessAsync(
                session.UserId,
                cancellationToken);

        return Ok(new
        {
            hasAccess
        });
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

    private static string GetErrorMessage(Exception ex)
    {
        if (ex is DbUpdateException dbUpdateException
            && dbUpdateException.InnerException?.Message is string innerMessage)
        {
            if (innerMessage.Contains("fk_cp_company", StringComparison.OrdinalIgnoreCase)
                || (innerMessage.Contains("23503", StringComparison.OrdinalIgnoreCase)
                    && innerMessage.Contains("companypolicies", StringComparison.OrdinalIgnoreCase)))
            {
                return "Company Id was not found. Create the company in Company Configuration first, or enter a valid Company Id.";
            }

            if (innerMessage.Contains("PK_leavetypemaster", StringComparison.OrdinalIgnoreCase))
            {
                return "Leave type save failed due to a database id conflict. Restart the API and try again, or contact your DBA to reset the leavetypemaster id sequence.";
            }

            if (innerMessage.Contains("uq_ltm_company_name", StringComparison.OrdinalIgnoreCase))
            {
                return "A leave type with this name already exists for this company.";
            }

            if (innerMessage.Contains("uq_hl_company_date", StringComparison.OrdinalIgnoreCase))
            {
                return "A holiday already exists on this date for this company.";
            }

            if (innerMessage.Contains("chk_cp_shift", StringComparison.OrdinalIgnoreCase))
            {
                return "Shift end must be later than shift start.";
            }

            return innerMessage;
        }

        return ex.Message;
    }

    [HttpGet]
public async Task<IActionResult> GetPolicies(
    CancellationToken cancellationToken)
{
    var session = GetSessionInfo();

    if (session is null)
    {
        return Unauthorized(new
        {
            message = "No active session."
        });
    }

    var policies =
        await _policyManager.GetPoliciesAsync(
            session.CompanyId,
            session.RoleId,
            cancellationToken);

    return Ok(policies);
}

[HttpPut]
public async Task<IActionResult> UpdatePolicy(
    [FromBody] PolicyUpdateDto request,
    CancellationToken cancellationToken)
{
    try
    {
        var session = GetSessionInfo();

        if (session is null)
        {
            return Unauthorized(new
            {
                message = "No active session."
            });
        }

        var result =
            await _policyManager.UpdatePolicyAsync(
                request,
                session.UserId,
                cancellationToken);

        return Ok(new
        {
            message =
                "Policy updated successfully.",
            data = result
        });
    }
    catch (KeyNotFoundException ex)
    {
        return NotFound(new
        {
            message = ex.Message
        });
    }
    catch (Exception ex)
    {
        return BadRequest(new
        {
            message = ex.Message
        });
    }
}

}

 