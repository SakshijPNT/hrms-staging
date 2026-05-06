using Hrms.Api.Extensions;
using Hrms.Application.DTOs.Requests;
using Hrms.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hrms.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class RequestsController(IRequestService requestService) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<RequestDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRequests(CancellationToken cancellationToken)
    {
        var result = await requestService.GetRequestsAsync(User.GetUserId(), User.HasElevatedAccess(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("my")]
    [ProducesResponseType(typeof(IReadOnlyList<RequestDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyRequests(CancellationToken cancellationToken)
    {
        var result = await requestService.GetMyRequestsAsync(User.GetUserId(), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(typeof(RequestDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] CreateRequestDto request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await requestService.CreateAsync(User.GetUserId(), request, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, result);
        }
        catch (InvalidOperationException exception)
        {
            return BadRequest(new { message = exception.Message });
        }
    }
}