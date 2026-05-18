using System.Text.Json;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Microsoft.AspNetCore.Mvc;



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
    public async Task<IActionResult> CreateUser([FromBody] UserUpsertDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var createdUser = await _userManager.CreateUserAsync(request);
        return CreatedAtAction(nameof(GetUserById), new { id = createdUser.Id }, createdUser);
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
        var rawSession = HttpContext.Session.GetString(SessionKey);
        if (rawSession is null)
        {
            return Unauthorized(new { message = "No active session." });
        }

        var session = JsonSerializer.Deserialize<SessionInfoDto>(rawSession);
        if (session is null)
        {
            return Unauthorized(new { message = "Invalid session." });
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

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetUserById(int id)
    {
        // This endpoint is currently used only for CreatedAtAction location creation.
        // The actual data can be returned by implementing a full query method later.
        return Ok(new { Id = id });
    }
}
