using System.ComponentModel.DataAnnotations;

namespace Hrms.Application.DTOs.Requests;

public sealed class CreateRequestDto
{
    [Required]
    public string Title { get; init; } = string.Empty;

    [Required]
    public string Description { get; init; } = string.Empty;

    public DateOnly StartDate { get; init; } = DateOnly.FromDateTime(DateTime.UtcNow);
    public DateOnly EndDate { get; init; } = DateOnly.FromDateTime(DateTime.UtcNow);
}