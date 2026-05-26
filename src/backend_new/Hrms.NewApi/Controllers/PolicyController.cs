using System.Text.Json;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Microsoft.AspNetCore.Mvc;

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

 