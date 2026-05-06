using Hrms.Application.DTOs.Requests;
using Hrms.Application.Interfaces.Repositories;
using Hrms.Application.Interfaces.Services;
using Hrms.Domain.Entities;

namespace Hrms.Infrastructure.Services;

public sealed class RequestService(
    IRequestRepository requestRepository,
    IUserRepository userRepository) : IRequestService
{
    public async Task<IReadOnlyList<RequestDto>> GetRequestsAsync(Guid currentUserId, bool hasElevatedAccess, CancellationToken cancellationToken = default)
    {
        var requests = hasElevatedAccess
            ? await requestRepository.GetAllAsync(cancellationToken)
            : await requestRepository.GetByUserIdAsync(currentUserId, cancellationToken);

        return requests.Select(MapToDto).ToList();
    }

    public async Task<IReadOnlyList<RequestDto>> GetMyRequestsAsync(Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var requests = await requestRepository.GetByUserIdAsync(currentUserId, cancellationToken);
        return requests.Select(MapToDto).ToList();
    }

    public async Task<RequestDto> CreateAsync(Guid currentUserId, CreateRequestDto request, CancellationToken cancellationToken = default)
    {
        _ = await userRepository.GetByIdAsync(currentUserId, cancellationToken)
            ?? throw new InvalidOperationException("Current user was not found.");

        if (request.EndDate < request.StartDate)
        {
            throw new InvalidOperationException("End date must be greater than or equal to the start date.");
        }

        var entity = new EmployeeRequest
        {
            UserId = currentUserId,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            StartDate = request.StartDate,
            EndDate = request.EndDate
        };

        await requestRepository.AddAsync(entity, cancellationToken);

        var createdRequest = (await requestRepository.GetByUserIdAsync(currentUserId, cancellationToken))
            .First(item => item.Id == entity.Id);

        return MapToDto(createdRequest);
    }

    private static RequestDto MapToDto(EmployeeRequest request)
    {
        return new RequestDto
        {
            Id = request.Id,
            EmployeeName = request.User?.FullName ?? string.Empty,
            Title = request.Title,
            Description = request.Description,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Status = request.Status.ToString(),
            SubmittedAtUtc = request.SubmittedAtUtc
        };
    }
}