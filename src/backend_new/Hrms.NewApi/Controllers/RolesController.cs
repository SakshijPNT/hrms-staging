using System.Text.Json;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Hrms.NewApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RolesController : ControllerBase
{
    private const string SessionKey = "UserSession";
    private readonly IRoleManager _roleManager;

    public RolesController(IRoleManager roleManager)
    {
        _roleManager = roleManager;
    }

    [HttpPost]
    public async Task<IActionResult> CreateRole([FromBody] RoleUpsertDto request, CancellationToken cancellationToken)
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
            var role = await _roleManager.CreateRoleAsync(request, session.CompanyId, cancellationToken);
            return CreatedAtAction(nameof(GetRolesForCompany), new { id = role.Id }, role);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] RoleUpsertDto request, CancellationToken cancellationToken)
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
            var role = await _roleManager.UpdateRoleAsync(id, request, session.CompanyId, cancellationToken);
            return Ok(role);
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

    [HttpGet("company")]
    public async Task<IActionResult> GetRolesForCompany(CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        var roles = await _roleManager.GetRolesForCompanyAsync(session.CompanyId, cancellationToken);
        return Ok(roles);
    }

    [HttpDelete("{id:int}")]
     public async Task<IActionResult> DeleteRole(int id, CancellationToken cancellationToken)
     {    
       var session = GetSessionInfo();
       if (session is null)
       {
           return Unauthorized(new { message = "No active session." });
       }

    try
    {
        await _roleManager.DeleteRoleAsync(id, session.CompanyId, cancellationToken);
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
        return rawSession is null ? null : JsonSerializer.Deserialize<SessionInfoDto>(rawSession);
    }

}
