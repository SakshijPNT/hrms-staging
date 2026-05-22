using Hrms.NewApi.Data;
using Hrms.NewApi.Dtos;
using Hrms.NewApi.Interfaces;
using Hrms.NewApi.Models;
using Microsoft.EntityFrameworkCore;

namespace Hrms.NewApi.Managers;

public class CompanyManager : ICompanyManager
{
    private const string ViewAllCompaniesActivityCode = "A0";
    private readonly HrmsDbContext _dbContext;

    public CompanyManager(HrmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CompanyResponseDto> CreateCompanyAsync(
        CompanyCreateDto request,
        int createdBy,
        CancellationToken cancellationToken = default)
    {
        var companyCodeTaken = await _dbContext.CompanyMasters.AnyAsync(
            x => x.CompanyCode == request.CompanyCode,
            cancellationToken);

        if (companyCodeTaken)
        {
            throw new InvalidOperationException($"Company with code {request.CompanyCode} already exists.");
        }

        var now = DateTimeOffset.UtcNow;
        var company = new CompanyMaster
        {  
            CompanyName = request.CompanyName,
            CompanyCode = request.CompanyCode,
            CompanyPhone = request.CompanyPhone,
            Address = request.Address,
            City = request.City,
            State = request.State,
            Country = request.Country,
            Pincode = request.Pincode,
            Timezone = request.Timezone,
            StatusCode = request.StatusCode,
            CreatedBy = createdBy,
            CreatedOn = now,
            UpdatedBy = createdBy,
            UpdatedOn = now,
        };

        _dbContext.CompanyMasters.Add(company);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapCompanyResponse(company);
    }



    public async Task<IReadOnlyList<CompanyListItemDto>> GetCompaniesAsync(int loggedInUserCompanyId,int loggedInUserRoleId,CancellationToken cancellationToken = default)
    {
        var canViewAllCompanies = await (
            from activityRoleMapping in _dbContext.ActivityRoleMappings
            join activity in _dbContext.ActivityMasters
                on activityRoleMapping.ActivityId equals activity.Id
            where activityRoleMapping.RoleId == loggedInUserRoleId
                && activityRoleMapping.StatusCode == 1
                && activity.StatusCode == 1
                && activity.ActivityCode == ViewAllCompaniesActivityCode
            select activity.Id
        ).AnyAsync(cancellationToken);

        var query = _dbContext.CompanyMasters.AsNoTracking();

        if (!canViewAllCompanies)
        {
            query = query.Where(x => x.Id == loggedInUserCompanyId);
        }

        return await query
            .OrderBy(x => x.CompanyName)
            .Select(x => new CompanyListItemDto
            {
                Id = x.Id,
                CompanyName = x.CompanyName,
                Timezone = x.Timezone,
                StatusCode = x.StatusCode,
                Country = x.Country,
            })
            .ToListAsync(cancellationToken);
    }

    private static CompanyResponseDto MapCompanyResponse(CompanyMaster company)
    {
        return new CompanyResponseDto
        {
            Id = company.Id,
            CompanyName = company.CompanyName,
            CompanyCode = company.CompanyCode,
            CompanyPhone = company.CompanyPhone,
            Address = company.Address,
            City = company.City,
            State = company.State,
            Country = company.Country,
            Pincode = company.Pincode,
            Timezone = company.Timezone,
            StatusCode = company.StatusCode,
            CreatedOn = company.CreatedOn,
            UpdatedOn = company.UpdatedOn,
        };
    }

    public async Task<bool> DeleteCompanyAsync(int companyId,int deletedBy,CancellationToken cancellationToken = default)
                {
                    var company = await _dbContext.CompanyMasters.FirstOrDefaultAsync(
                            x => x.Id == companyId,
                            cancellationToken);

                    if (company == null)
                    {
                        throw new KeyNotFoundException("Company not found.");
                    }

                    // Soft Delete
                    company.StatusCode = 0;

                    company.UpdatedBy = deletedBy;
                    company.UpdatedOn = DateTimeOffset.UtcNow;

                    await _dbContext.SaveChangesAsync(cancellationToken);

                    return true;
                }
}
