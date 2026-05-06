using Hrms.Application.DTOs.Auth;
using Hrms.Application.DTOs.Dashboard;
using Hrms.Application.DTOs.Requests;
using Hrms.Application.Interfaces.Repositories;
using Hrms.Application.Interfaces.Services;
using Hrms.Domain.Enums;

namespace Hrms.Infrastructure.Services;

public sealed class DashboardService(
    IUserRepository userRepository,
    IRequestRepository requestRepository,
    IAttendanceRepository attendanceRepository) : IDashboardService
{
    public async Task<DashboardSummaryDto> GetSummaryAsync(Guid currentUserId, bool hasElevatedAccess, CancellationToken cancellationToken = default)
    {
        var currentUser = await userRepository.GetByIdAsync(currentUserId, cancellationToken)
            ?? throw new InvalidOperationException("Current user was not found.");

        var recentRequests = await requestRepository.GetRecentAsync(
            5,
            hasElevatedAccess ? null : currentUserId,
            cancellationToken);

        return new DashboardSummaryDto
        {
            TotalEmployees = await userRepository.CountAsync(cancellationToken),
            PendingRequests = await requestRepository.CountByStatusAsync(RequestStatus.Pending, cancellationToken),
            ApprovedRequests = await requestRepository.CountByStatusAsync(RequestStatus.Approved, cancellationToken),
            PresentToday = await attendanceRepository.CountPresentByDateAsync(DateOnly.FromDateTime(DateTime.UtcNow), cancellationToken),
            CurrentUser = new AuthenticatedUserDto
            {
                Id = currentUser.Id,
                Email = currentUser.Email,
                FullName = currentUser.FullName,
                Role = currentUser.Role?.Name ?? "Employee",
                EmployeeCode = currentUser.EmployeeProfile?.EmployeeCode ?? string.Empty
            },
            RecentRequests = recentRequests.Select(request => new RequestDto
            {
                Id = request.Id,
                EmployeeName = request.User?.FullName ?? string.Empty,
                Title = request.Title,
                Description = request.Description,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                Status = request.Status.ToString(),
                SubmittedAtUtc = request.SubmittedAtUtc
            }).ToList()
        };
    }
}