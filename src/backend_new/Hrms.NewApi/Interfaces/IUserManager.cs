using Hrms.NewApi.Dtos;

namespace Hrms.NewApi.Interfaces;

public interface IUserManager
{
    Task<UserResponseDto> CreateUserAsync(UserUpsertDto request, CancellationToken cancellationToken = default);
    Task<UserResponseDto> UpdateUserAsync(int id, UserUpsertDto request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CompanyUserListItemDto>> GetCompanyUsersAsync(int companyId, CancellationToken cancellationToken = default);
}
