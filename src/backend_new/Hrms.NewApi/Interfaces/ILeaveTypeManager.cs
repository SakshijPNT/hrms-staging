using Hrms.NewApi.Dtos;

namespace Hrms.NewApi.Interfaces;

public interface ILeaveTypeManager
{
    Task<IReadOnlyList<LeaveTypeResponseDto>> GetLeaveTypesAsync(
        int companyId,
        CancellationToken cancellationToken = default);

    Task SyncLeaveTypesAsync(
        int companyId,
        IReadOnlyList<LeaveTypeSyncItemDto> leaveTypes,
        int userId,
        CancellationToken cancellationToken = default);
}
