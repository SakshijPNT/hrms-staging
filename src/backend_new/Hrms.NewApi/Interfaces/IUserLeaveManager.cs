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

    Task<UserLeaveApplicationListItemDto> UpdateLeaveApplicationAsync(
        int leaveId,
        int userId,
        int companyId,
        ApplyLeaveApplicationDto request,
        CancellationToken cancellationToken = default);

    Task DeleteLeaveApplicationAsync(
        int leaveId,
        int userId,
        CancellationToken cancellationToken = default);

        Task<IEnumerable<UserLeaveBalanceDTO>> GetUserLeaveBalances(
            int userId,
            int companyId,
            CancellationToken cancellationToken);

        Task<UserLeaveBalanceDetailDto> GetUserLeaveBalanceDetailAsync(
            int userId,
            int companyId,
            int leaveTypeId,
            CancellationToken cancellationToken = default);

        Task InitializeLeaveBalancesForUserAsync(
            int userId,
            int companyId,
            int createdBy,
            CancellationToken cancellationToken = default);

        Task<IEnumerable<LeaveTypeDropdownDto>> GetLeaveTypesAsync(
            int companyId,
            CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ManagerLeaveApplicationListItemDto>> GetPendingLeaveApplicationsForManagerAsync(
        int managerId,
        int companyId,
        CancellationToken cancellationToken = default);

    Task<ManagerLeaveApplicationListItemDto> ApproveLeaveAsync(
        int id,
        int approverId,
        int companyId,
        ReviewLeaveApplicationDto request,
        CancellationToken cancellationToken = default);

    Task<ManagerLeaveApplicationListItemDto> RejectLeaveAsync(
        int id,
        int approverId,
        int companyId,
        ReviewLeaveApplicationDto request,
        CancellationToken cancellationToken = default);

    Task<LeaveApplicationMonthlyPreviewDto> PreviewLeaveApplicationMonthlyAsync(
        int userId,
        int companyId,
        ApplyLeaveApplicationDto request,
        int? excludeLeaveId = null,
        CancellationToken cancellationToken = default);
}


