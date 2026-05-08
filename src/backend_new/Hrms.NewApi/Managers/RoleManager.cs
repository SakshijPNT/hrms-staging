using Hrms.NewApi.Data;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Hrms.NewApi.Models;
using Microsoft.EntityFrameworkCore;

namespace Hrms.NewApi.Managers;

public class RoleManager : IRoleManager
{
    private readonly HrmsDbContext _dbContext;

    public RoleManager(HrmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<RoleResponseDto> CreateRoleAsync(
        RoleUpsertDto request,
        int fallbackCompanyId,
        CancellationToken cancellationToken = default)
    {
        var companyId = request.CompanyId ?? fallbackCompanyId;
        await ValidateRoleAsync(request, companyId, currentRoleId: null, cancellationToken);

        var role = new RoleMaster
        {
            RoleName = request.RoleName,
            CompanyId = companyId,
            Description = request.Description,
            StatusCode = request.StatusCode,
            CreatedBy = request.CreatedBy,
            UpdatedBy = request.UpdatedBy,
            CreatedOn = DateTimeOffset.UtcNow,
            UpdatedOn = DateTimeOffset.UtcNow,
        };

        _dbContext.RoleMasters.Add(role);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapRoleResponse(role);
    }

    public async Task<RoleResponseDto> UpdateRoleAsync(
        int id,
        RoleUpsertDto request,
        int fallbackCompanyId,
        CancellationToken cancellationToken = default)
    {
        var role = await _dbContext.RoleMasters.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException($"Role with id {id} does not exist.");

        var companyId = request.CompanyId ?? fallbackCompanyId;
        await ValidateRoleAsync(request, companyId, id, cancellationToken);

        role.RoleName = request.RoleName;
        role.CompanyId = companyId;
        role.Description = request.Description;
        role.StatusCode = request.StatusCode;
        role.UpdatedBy = request.UpdatedBy;
        role.UpdatedOn = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapRoleResponse(role);
    }

    public async Task<IReadOnlyList<RoleResponseDto>> GetRolesForCompanyAsync(
        int companyId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.RoleMasters
            .AsNoTracking()
            .Where(x => x.CompanyId == companyId)
            .OrderBy(x => x.RoleName)
            .Select(x => new RoleResponseDto
            {
                Id = x.Id,
                RoleName = x.RoleName,
                CompanyId = x.CompanyId,
                Description = x.Description,
                StatusCode = x.StatusCode,
                CreatedOn = x.CreatedOn,
                UpdatedOn = x.UpdatedOn,
            })
            .ToListAsync(cancellationToken);
    }

    private async Task ValidateRoleAsync(
        RoleUpsertDto request,
        int companyId,
        int? currentRoleId,
        CancellationToken cancellationToken)
    {
        var companyExists = await _dbContext.CompanyMasters.AnyAsync(x => x.Id == companyId, cancellationToken);
        if (!companyExists)
        {
            throw new InvalidOperationException($"Company with id {companyId} does not exist.");
        }

        var roleNameTaken = await _dbContext.RoleMasters.AnyAsync(
            x => x.CompanyId == companyId
                && x.RoleName == request.RoleName
                && (!currentRoleId.HasValue || x.Id != currentRoleId.Value),
            cancellationToken);
        if (roleNameTaken)
        {
            throw new InvalidOperationException($"A role with name {request.RoleName} already exists for this company.");
        }
    }

    private static RoleResponseDto MapRoleResponse(RoleMaster role)
    {
        return new RoleResponseDto
        {
            Id = role.Id,
            RoleName = role.RoleName,
            CompanyId = role.CompanyId,
            Description = role.Description,
            StatusCode = role.StatusCode,
            CreatedOn = role.CreatedOn,
            UpdatedOn = role.UpdatedOn,
        };
    }
}
