namespace Hrms.Application.DTOs.Requests;

public sealed class RequestDto
{
    public Guid Id { get; init; }
    public string EmployeeName { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public DateOnly StartDate { get; init; }
    public DateOnly EndDate { get; init; }
    public string Status { get; init; } = string.Empty;
    public DateTime SubmittedAtUtc { get; init; }
}