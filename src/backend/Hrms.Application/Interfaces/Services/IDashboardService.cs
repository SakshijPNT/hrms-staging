using Hrms.Application.DTOs.Dashboard;

namespace Hrms.Application.Interfaces.Services;

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync(Guid currentUserId, bool hasElevatedAccess, CancellationToken cancellationToken = default);
}