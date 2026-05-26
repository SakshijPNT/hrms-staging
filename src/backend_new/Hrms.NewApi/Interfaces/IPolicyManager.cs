using Hrms.NewApi.Dtos;

namespace Hrms.NewApi.Interfaces;

public interface IPolicyManager
{
    Task<PolicyResponseDto> CreatePolicyAsync(PolicyCreateDto request,int createdBy,CancellationToken cancellationToken = default);
    Task<bool> HasPolicyAccessAsync(int userId,CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PolicyResponseDto>> GetPoliciesAsync(int loggedInUserCompanyId,int loggedInUserRoleId,CancellationToken cancellationToken = default);
    Task<PolicyResponseDto> UpdatePolicyAsync(PolicyUpdateDto request,int updatedBy,CancellationToken cancellationToken = default);
}
        
