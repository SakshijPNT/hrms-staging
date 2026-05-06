using System.ComponentModel.DataAnnotations;

namespace Hrms.Application.DTOs.Administration;

public sealed class CreateActivityRequestDto
{
    [Required]
    public string Name { get; init; } = string.Empty;

    [Required]
    public string Code { get; init; } = string.Empty;

    [Required]
    public string Description { get; init; } = string.Empty;

    public string Type { get; init; } = "System";

    public string ModuleCode { get; init; } = string.Empty;

    public string ModuleName { get; init; } = string.Empty;
}