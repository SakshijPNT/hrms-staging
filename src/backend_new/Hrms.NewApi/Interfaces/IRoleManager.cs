    using Hrms.NewApi.Dtos;

    namespace Hrms.NewApi.Interfaces;

    public interface IRoleManager
    {
        Task<RoleResponseDto> CreateRoleAsync(RoleUpsertDto request, int fallbackCompanyId, CancellationToken cancellationToken = default);
    Task<RoleResponseDto> UpdateRoleAsync(int id, RoleUpsertDto request, int fallbackCompanyId, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<RoleResponseDto>> GetRolesForCompanyAsync(int companyId, CancellationToken cancellationToken = default);
        Task DeleteRoleAsync(int id, int companyId, CancellationToken cancellationToken = default);

        Task SetRoleStatusAsync(int id, int companyId, int statusCode, CancellationToken cancellationToken = default);
    }
