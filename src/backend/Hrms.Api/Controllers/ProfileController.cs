using Hrms.Api.Extensions;
using Hrms.Application.DTOs.Profile;
using Hrms.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hrms.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class ProfileController(IProfileService profileService) : ControllerBase
{
    [HttpGet("me")]
    [ProducesResponseType(typeof(EmployeeProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyProfile(CancellationToken cancellationToken)
    {
        var result = await profileService.GetMyProfileAsync(User.GetUserId(), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }
}