using Hrms.Application.DTOs.Auth;
using Hrms.Application.DTOs.Requests;

namespace Hrms.Application.DTOs.Dashboard;

public sealed class DashboardSummaryDto
{
    public int TotalEmployees { get; init; }
    public int PendingRequests { get; init; }
    public int ApprovedRequests { get; init; }
    public int PresentToday { get; init; }
    public AuthenticatedUserDto CurrentUser { get; init; } = new();
    public IReadOnlyList<RequestDto> RecentRequests { get; init; } = Array.Empty<RequestDto>();
}