using Hrms.NewApi.Dtos;

namespace Hrms.NewApi.Interfaces;

public interface IUserManager
{
    Task<UserResponseDto> CreateUserAsync(UserUpsertDto request, CancellationToken cancellationToken = default);
    Task<UserResponseDto> UpdateUserAsync(int id, UserUpsertDto request, CancellationToken cancellationToken = default);
    Task DeleteUserAsync(int id, int updatedBy, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CompanyUserListItemDto>> GetCompanyUsersAsync(int companyId, CancellationToken cancellationToken = default);
    
    Task UpdateUserStatusAsync(int id, int statusCode, CancellationToken cancellationToken = default);


    Task<IReadOnlyList<ManagerListItemDto>> GetManagerListAsync(int companyId, CancellationToken cancellationToken = default);
}
