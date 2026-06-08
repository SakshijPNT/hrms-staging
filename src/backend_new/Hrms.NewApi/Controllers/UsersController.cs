using System.Text.Json;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;



namespace Hrms.NewApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private const string SessionKey = "UserSession";
    private readonly IUserManager _userManager;

    public UsersController(IUserManager userManager)
    {
        _userManager = userManager;
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser(
        [FromBody] UserUpsertDto request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var createdUser = await _userManager.CreateUserAsync(request, cancellationToken);
            return CreatedAtAction(nameof(GetUserById), new { id = createdUser.Id }, createdUser);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pgEx)
        {
            return BadRequest(new { message = GetDatabaseErrorMessage(pgEx) });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateUser(
        int id,
        [FromBody] UserUpsertDto request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var updatedUser = await _userManager.UpdateUserAsync(id, request, cancellationToken);
            return Ok(updatedUser);
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
    public async Task<IActionResult> GetCompanyUsers(CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        var users = await _userManager.GetCompanyUsersAsync(session.CompanyId, cancellationToken);
        return Ok(users);
    }

    [HttpPut("{id:int}/status")]
public async Task<IActionResult> UpdateUserStatus(
    int id,
    [FromBody] UpdateStatusDto request,
    CancellationToken cancellationToken)
{
    try
    {
        await _userManager.UpdateUserStatusAsync(
            id,
            request.StatusCode,
            cancellationToken
        );

        return Ok(new
        {
            message = "User status updated successfully."
        });
    }
    catch (KeyNotFoundException ex)
    {
        return NotFound(new
        {
            message = ex.Message
        });
    }
}

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteUser(int id, CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        try
        {
            await _userManager.DeleteUserAsync(id, session.UserId, cancellationToken);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("managers")]
    public async Task<IActionResult> GetManagerList(CancellationToken cancellationToken)
    {
        var session = GetSessionInfo();
        if (session is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        var managers = await _userManager.GetManagerListAsync(session.CompanyId, cancellationToken);
        return Ok(managers);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetUserById(int id)
    {
        // This endpoint is currently used only for CreatedAtAction location creation.
        // The actual data can be returned by implementing a full query method later.
        return Ok(new { Id = id });
    }

    private SessionInfoDto? GetSessionInfo()
    {
        var rawSession = HttpContext.Session.GetString(SessionKey);
        return rawSession is null ? null : JsonSerializer.Deserialize<SessionInfoDto>(rawSession);
    }

    private static string GetDatabaseErrorMessage(PostgresException pgEx)
    {
        if (pgEx.SqlState == PostgresErrorCodes.UniqueViolation
            && pgEx.ConstraintName == "PK_userleavebalances")
        {
            return "Leave balances could not be initialized because the database ID sequence is out of sync. Run the latest database migrations and try again.";
        }

        return "Unable to save the user due to a database conflict. Please try again or contact support.";
    }
}
