using System.Text.Json;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Hrms.NewApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private const string SessionKey ="UserSession";

    private readonly IAuthManager _authManager;

    public AuthController(IAuthManager authManager)
    {
        _authManager = authManager;
    }

    // LOGIN API
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request,CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var sessionInfo =
                await _authManager.LoginAsync(request,cancellationToken);

            // SAVE SESSION
            HttpContext.Session.SetString(
                SessionKey,
                JsonSerializer.Serialize(sessionInfo));

            // RETURN SESSION INFO
            return Ok(sessionInfo);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(
                new { message = ex.Message });
        }
    }

    // GET SESSION INFO (timezone always loaded from company_master)
    [HttpGet("session")]
    public async Task<IActionResult> GetSession(CancellationToken cancellationToken)
    {
        var raw = HttpContext.Session.GetString(SessionKey);

        if (raw is null)
        {
            return Unauthorized(
                new
                {
                    message ="No active session."
                });
        }

        var session = JsonSerializer.Deserialize<SessionInfoDto>(raw)!;
        session = await _authManager.RefreshSessionFromCompanyAsync(
            session,
            cancellationToken);

        HttpContext.Session.SetString(
            SessionKey,
            JsonSerializer.Serialize(session));

        return Ok(session);
    }

    // GET MODULES + ACTIVITIES
    [HttpGet("session-data/{userId}")]
    public async Task<IActionResult>
        GetSessionData(int userId,CancellationToken cancellationToken)
    {
        try
        {
            var result =await _authManager
                    .GetSessionDataAsync(
                        userId,
                        cancellationToken);

            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(
                new { message = ex.Message });
        }
    }

    // LOGOUT
    /*[HttpPost("logout")]
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();

        return NoContent();
    }*/
}





/*using System.Text.Json;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Hrms.NewApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private const string SessionKey = "UserSession";
    private readonly IAuthManager _authManager;

    public AuthController(IAuthManager authManager)
    {
        _authManager = authManager;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var (sessionInfo, loginResponse) = await _authManager.LoginAsync(request, cancellationToken);
            HttpContext.Session.SetString(SessionKey, JsonSerializer.Serialize(sessionInfo));
            return Ok(loginResponse);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpGet("session")]
    public IActionResult GetSession()
    {
        var raw = HttpContext.Session.GetString(SessionKey);
        if (raw is null)
            return Unauthorized(new { message = "No active session." });

        return Ok(JsonSerializer.Deserialize<SessionInfoDto>(raw));
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        HttpContext.Session.Clear();
        return NoContent();
    }
}*/
