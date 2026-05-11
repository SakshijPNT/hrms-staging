using Hrms.NewApi.Dtos;

namespace Hrms.NewApi.Interfaces;

public interface IUserLeaveManager
{
    Task<UserLeaveApplicationListItemDto> ApplyLeaveAsync(
        int userId,
        int companyId,
        ApplyLeaveApplicationDto request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<UserLeaveApplicationListItemDto>> GetLeaveApplicationsForUserAsync(
        int userId,
        CancellationToken cancellationToken = default);

    Task<UserLeaveApplicationListItemDto> CancelLeaveAsync(
        int leaveId,
        int userId,
        CancellationToken cancellationToken = default);
}
