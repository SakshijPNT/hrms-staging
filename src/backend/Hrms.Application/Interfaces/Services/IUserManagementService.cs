using Hrms.Application.DTOs.Administration;

namespace Hrms.Application.Interfaces.Services;

public interface IUserManagementService
{
    Task<IReadOnlyList<CompanyUserDto>> GetUsersAsync(CancellationToken cancellationToken = default);
    Task<CompanyUserDto> CreateAsync(CreateCompanyUserRequestDto request, CancellationToken cancellationToken = default);
    Task<CompanyUserDto> UpdateAsync(Guid userId, UpdateCompanyUserRequestDto request, CancellationToken cancellationToken = default);
    Task<CompanyUserDto> UpdateUserRoleAsync(Guid userId, UpdateUserRoleRequestDto request, CancellationToken cancellationToken = default);
    Task<CompanyUserDto> SetEditableAsync(Guid userId, bool isEditable, CancellationToken cancellationToken = default);
    Task<CompanyUserDto> SetActiveAsync(Guid userId, bool isActive, CancellationToken cancellationToken = default);
}