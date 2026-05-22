using Hrms.NewApi.Dtos;

namespace Hrms.NewApi.Interfaces;

public interface ICompanyManager
{
    Task<CompanyResponseDto> CreateCompanyAsync(CompanyCreateDto request,int createdBy,CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CompanyListItemDto>> GetCompaniesAsync(int loggedInUserCompanyId,int loggedInUserRoleId,CancellationToken cancellationToken = default);

    Task<bool> DeleteCompanyAsync(int companyId,int deletedBy,CancellationToken cancellationToken = default);
}
