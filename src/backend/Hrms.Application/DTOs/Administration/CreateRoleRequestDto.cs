using System.ComponentModel.DataAnnotations;

namespace Hrms.Application.DTOs.Administration;

public sealed class CreateRoleRequestDto
{
    [Required]
    public string Name { get; init; } = string.Empty;

    [Required]
    public string Description { get; init; } = string.Empty;

    [MinLength(1)]
    public IReadOnlyList<Guid> ActivityIds { get; init; } = [];
}