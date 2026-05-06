using Hrms.Api.Extensions;
using Hrms.Application.DTOs.Administration;
using Hrms.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Hrms.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public sealed class PermissionsController(IPermissionService permissionService) : ControllerBase
{
    /// <summary>
    /// Get all permissions (grouped by activity, with View/Edit types).
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<PermissionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var result = await permissionService.GetAllPermissionsAsync(cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Get permissions assigned to a specific role.
    /// </summary>
    [HttpGet("role/{roleId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<RolePermissionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetRolePermissions(Guid roleId, CancellationToken cancellationToken)
    {
        var result = await permissionService.GetRolePermissionsAsync(roleId, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Assign (replace) permissions for a role.
    /// </summary>
    [HttpPut("role/{roleId:guid}")]
    [ProducesResponseType(typeof(IReadOnlyList<RolePermissionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> AssignToRole(
        Guid roleId,
        [FromBody] AssignRolePermissionsRequestDto request,
        CancellationToken cancellationToken)
    {
        var assignedBy = User.GetUserId();
        var result = await permissionService.AssignPermissionsToRoleAsync(roleId, request, assignedBy, cancellationToken);
        return Ok(result);
    }
}
