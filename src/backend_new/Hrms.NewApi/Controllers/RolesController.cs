using System.Text.Json;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Hrms.NewApi.Data;
using Microsoft.EntityFrameworkCore;

namespace Hrms.NewApi.Controllers;


[ApiController]
[Route("api/[controller]")]
public class RolesController : ControllerBase
{
    private const string SessionKey = "UserSession";
    private readonly IRoleManager _roleManager;

    private readonly HrmsDbContext _dbContext;

    /*public RolesController(IRoleManager roleManager)
    {
        _roleManager = roleManager;
    }*/

    public RolesController(IRoleManager roleManager, HrmsDbContext dbContext)
{
    _roleManager = roleManager;
    _dbContext = dbContext;
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

        request.CompanyId = session.CompanyId;
        request.CreatedBy = session.UserId;
        request.UpdatedBy = session.UserId;

        try
        {
            var role = await _roleManager.CreateRoleAsync(request, session.CompanyId, cancellationToken);
            //return CreatedAtAction(nameof(GetRolesForCompany), new { id = role.Id }, role);
            return Ok(role);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }


    //  ADD THE NEW ENDPOINT RIGHT HERE 
[HttpGet("activities")]
public async Task<IActionResult> GetActivities(CancellationToken cancellationToken)
{
    var session = GetSessionInfo();
    if (session is null)
    {
        return Unauthorized(new { message = "No active session." });
    }

    var activities = await _dbContext.ActivityMasters
    .Where(a => a.StatusCode == 1)
    .Select(a => new
    {
        a.Id,
        a.ActivityName
    })
    .ToListAsync(cancellationToken);

    return Ok(activities);
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

        request.CompanyId = session.CompanyId;
        request.CreatedBy = session.UserId;
        request.UpdatedBy = session.UserId;

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


[HttpPut("{id:int}/status")]
public async Task<IActionResult> SetRoleStatus(
    int id,
    [FromBody] UpdateRoleStatusDto request,
    CancellationToken cancellationToken)
{
    var session = GetSessionInfo();

    if (session is null)
    {
        return Unauthorized(
            new { message = "No active session." });
    }

    try
    {
        await _roleManager.SetRoleStatusAsync(
            id,
            session.CompanyId,
            request.StatusCode,
            cancellationToken);

        return NoContent();
    }
    catch (KeyNotFoundException ex)
    {
        return NotFound(
            new { message = ex.Message });
    }
}
 

    private SessionInfoDto? GetSessionInfo()
    {
        var rawSession = HttpContext.Session.GetString(SessionKey);
        return rawSession is null ? null : JsonSerializer.Deserialize<SessionInfoDto>(rawSession);
    }

}
