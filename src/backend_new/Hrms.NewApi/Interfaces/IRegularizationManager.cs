using Hrms.NewApi.Dtos;

namespace Hrms.NewApi.Interfaces;

public interface IRegularizationManager
{
    Task<RegularizationPreviewDto> GetPreviewAsync(
        int userId,
        int companyId,
        DateOnly logDate,
        CancellationToken cancellationToken = default);

    Task<RegularizationListItemDto> CreateAsync(
        int userId,
        int companyId,
        CreateRegularizationDto request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RegularizationListItemDto>> GetMyRequestsAsync(
        int userId,
        CancellationToken cancellationToken = default);

    Task<RegularizationListItemDto> CancelAsync(
        int id,
        int userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ManagerRegularizationListItemDto>> GetManagerRegularizationRequestsAsync(
        int managerId,
        int companyId,
        CancellationToken cancellationToken = default);

    Task<RegularizationListItemDto> ApproveAsync(
        int id,
        int approverId,
        int companyId,
        ReviewRegularizationDto request,
        CancellationToken cancellationToken = default);

    Task<RegularizationListItemDto> RejectAsync(
        int id,
        int approverId,
        int companyId,
        ReviewRegularizationDto request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AdminRegularizationQueueItemDto>> GetAdminPendingQueueAsync(
        int adminUserId,
        int companyId,
        CancellationToken cancellationToken = default);

    Task<RegularizationListItemDto> AdminApproveAsync(
        int id,
        int adminUserId,
        int companyId,
        ReviewRegularizationDto request,
        CancellationToken cancellationToken = default);

    Task<RegularizationListItemDto> AdminRejectAsync(
        int id,
        int adminUserId,
        int companyId,
        ReviewRegularizationDto request,
        CancellationToken cancellationToken = default);

    Task<RegularizationPreviewDto> GetAdminManualCorrectionPreviewAsync(
        int targetUserId,
        int companyId,
        DateOnly logDate,
        CancellationToken cancellationToken = default);

    Task<AdminManualCorrectionResultDto> ApplyAdminManualCorrectionAsync(
        int adminUserId,
        int companyId,
        CreateAdminManualCorrectionDto request,
        CancellationToken cancellationToken = default);
}
